-- Phase 3: subscriptions, lead routing, notifications, admin/security hardening
create extension if not exists pgcrypto;

alter table if exists public.profiles
  add column if not exists role text default 'customer',
  add column if not exists updated_at timestamptz default now();

alter table if exists public.vendors
  add column if not exists is_admin boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists is_suspended boolean default false,
  add column if not exists lead_limit_override integer,
  add column if not exists inventory_limit_override integer,
  add column if not exists monthly_leads_used integer default 0,
  add column if not exists average_response_hours numeric,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists updated_at timestamptz default now();

update public.vendors
set subscription_plan = case
  when lower(coalesce(subscription_plan, '')) in ('starter', 'growth', '') then 'basic'
  else lower(subscription_plan)
end
where true;

update public.vendors
set subscription_status = coalesce(nullif(subscription_status, ''), 'trialing')
where true;

create table if not exists public.vendor_subscriptions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  plan_code text not null default 'basic',
  plan_currency text not null default 'USD',
  monthly_price numeric not null default 49.99,
  billing_interval text not null default 'monthly',
  status text not null default 'trialing',
  free_trial_days integer not null default 7,
  trial_started_at timestamptz default now(),
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  lead_limit integer,
  inventory_limit integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (vendor_id)
);

insert into public.vendor_subscriptions (vendor_id, plan_code, plan_currency, monthly_price, status, free_trial_days, trial_started_at, trial_ends_at, lead_limit, inventory_limit)
select v.id,
       coalesce(nullif(v.subscription_plan, ''), 'basic'),
       'USD',
       case lower(coalesce(v.subscription_plan, 'basic'))
         when 'premium' then 109.99
         when 'pro' then 99.99
         else 49.99
       end,
       coalesce(nullif(v.subscription_status, ''), 'trialing'),
       7,
       coalesce(v.trial_started_at, now()),
       coalesce(v.trial_ends_at, now() + interval '7 day'),
       case lower(coalesce(v.subscription_plan, 'basic'))
         when 'premium' then null
         when 'pro' then 45
         else 15
       end,
       case lower(coalesce(v.subscription_plan, 'basic'))
         when 'premium' then null
         when 'pro' then 100
         else 25
       end
from public.vendors v
on conflict (vendor_id) do nothing;

alter table if exists public.notification_events
  add column if not exists recipient_vendor_id uuid references public.vendors(id) on delete set null,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_vendor_subscriptions_vendor_id on public.vendor_subscriptions(vendor_id);
create index if not exists idx_vendors_subscription_plan on public.vendors(subscription_plan, subscription_status);
create index if not exists idx_vendors_flags on public.vendors(is_featured, is_suspended, is_onboarded);
create index if not exists idx_notification_events_vendor on public.notification_events(recipient_vendor_id);
create index if not exists idx_notification_events_status on public.notification_events(status, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_vendor_subscriptions_updated_at on public.vendor_subscriptions;
create trigger set_vendor_subscriptions_updated_at before update on public.vendor_subscriptions for each row execute procedure public.set_updated_at();
drop trigger if exists set_notification_events_updated_at on public.notification_events;
create trigger set_notification_events_updated_at before update on public.notification_events for each row execute procedure public.set_updated_at();


alter table public.vendor_subscriptions enable row level security;

 drop policy if exists "vendor_subscriptions_vendor_read_own" on public.vendor_subscriptions;
create policy "vendor_subscriptions_vendor_read_own" on public.vendor_subscriptions
for select using (
  exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())
);

 drop policy if exists "vendor_subscriptions_vendor_update_own" on public.vendor_subscriptions;
create policy "vendor_subscriptions_vendor_update_own" on public.vendor_subscriptions
for update using (
  exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())
);

 drop policy if exists "notification_events_read_relevant" on public.notification_events;
create policy "notification_events_read_relevant" on public.notification_events
for select using (
  recipient_email = auth.email()
  or exists (select 1 from public.vendors v where v.id = recipient_vendor_id and v.user_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'admin')
);

 drop policy if exists "notification_events_update_relevant" on public.notification_events;
create policy "notification_events_update_relevant" on public.notification_events
for update using (
  recipient_email = auth.email()
  or exists (select 1 from public.vendors v where v.id = recipient_vendor_id and v.user_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'admin')
);
