-- Phase 1 marketplace hardening
create extension if not exists pgcrypto;

create table if not exists public.vendor_catalog (
  id text primary key,
  vendor_id uuid references public.vendors(id) on delete cascade,
  vendor_name text,
  invite_code text,
  title text not null,
  category text not null,
  price numeric default 0,
  currency text default 'USD',
  metal text,
  metal_purity text,
  stone text,
  shape text,
  image_url text,
  description text,
  style_mood text,
  inventory_count integer default 0,
  market text default 'usa',
  specs jsonb default '{}'::jsonb,
  is_active boolean default true,
  is_approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vendor_leads
  add column if not exists invite_code text,
  add column if not exists routing_mode text,
  add column if not exists catalog_item_title text,
  add column if not exists assigned_vendor_name text,
  add column if not exists lead_source_detail text;

create table if not exists public.vendor_quotes (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete cascade,
  lead_id uuid references public.vendor_leads(id) on delete cascade,
  quote_amount numeric default 0,
  currency text default 'USD',
  estimated_days integer,
  quote_message text,
  deposit_percent numeric default 50,
  timeline text,
  notes text,
  status text default 'sent',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete cascade,
  lead_id uuid references public.vendor_leads(id) on delete set null,
  order_number text,
  customer_name text,
  customer_email text,
  design_title text,
  quote_amount numeric default 0,
  deposit_amount numeric default 0,
  balance_amount numeric default 0,
  timeline text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  audience text,
  channel text default 'in_app',
  title text,
  body text,
  recipient_email text,
  reference_type text,
  reference_id text,
  status text default 'unread',
  created_at timestamptz default now()
);

create index if not exists idx_vendor_catalog_vendor_id on public.vendor_catalog(vendor_id);
create index if not exists idx_vendor_catalog_public on public.vendor_catalog(is_active, is_approved);
create index if not exists idx_vendor_quotes_vendor_id on public.vendor_quotes(vendor_id);
create index if not exists idx_vendor_quotes_lead_id on public.vendor_quotes(lead_id);
create index if not exists idx_vendor_orders_vendor_id on public.vendor_orders(vendor_id);
create index if not exists idx_notification_events_recipient_email on public.notification_events(recipient_email);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_vendor_catalog_updated_at on public.vendor_catalog;
create trigger set_vendor_catalog_updated_at before update on public.vendor_catalog for each row execute procedure public.set_updated_at();
drop trigger if exists set_vendor_quotes_updated_at on public.vendor_quotes;
create trigger set_vendor_quotes_updated_at before update on public.vendor_quotes for each row execute procedure public.set_updated_at();
drop trigger if exists set_vendor_orders_updated_at on public.vendor_orders;
create trigger set_vendor_orders_updated_at before update on public.vendor_orders for each row execute procedure public.set_updated_at();

alter table public.vendor_catalog enable row level security;
alter table public.vendor_quotes enable row level security;
alter table public.vendor_orders enable row level security;
alter table public.notification_events enable row level security;

 drop policy if exists "vendor_catalog_public_read" on public.vendor_catalog;
create policy "vendor_catalog_public_read" on public.vendor_catalog for select using (is_active = true and is_approved = true);
 drop policy if exists "vendor_catalog_vendor_read_own" on public.vendor_catalog;
create policy "vendor_catalog_vendor_read_own" on public.vendor_catalog for select using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));
 drop policy if exists "vendor_catalog_vendor_insert_own" on public.vendor_catalog;
create policy "vendor_catalog_vendor_insert_own" on public.vendor_catalog for insert with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));
 drop policy if exists "vendor_catalog_vendor_update_own" on public.vendor_catalog;
create policy "vendor_catalog_vendor_update_own" on public.vendor_catalog for update using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())) with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));
 drop policy if exists "vendor_catalog_vendor_delete_own" on public.vendor_catalog;
create policy "vendor_catalog_vendor_delete_own" on public.vendor_catalog for delete using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));

 drop policy if exists "vendor_quotes_vendor_read_own" on public.vendor_quotes;
create policy "vendor_quotes_vendor_read_own" on public.vendor_quotes for select using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));
 drop policy if exists "vendor_quotes_vendor_insert_own" on public.vendor_quotes;
create policy "vendor_quotes_vendor_insert_own" on public.vendor_quotes for insert with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));
 drop policy if exists "vendor_quotes_vendor_update_own" on public.vendor_quotes;
create policy "vendor_quotes_vendor_update_own" on public.vendor_quotes for update using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())) with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));

 drop policy if exists "vendor_orders_vendor_read_own" on public.vendor_orders;
create policy "vendor_orders_vendor_read_own" on public.vendor_orders for select using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));
 drop policy if exists "vendor_orders_vendor_insert_own" on public.vendor_orders;
create policy "vendor_orders_vendor_insert_own" on public.vendor_orders for insert with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));
 drop policy if exists "vendor_orders_vendor_update_own" on public.vendor_orders;
create policy "vendor_orders_vendor_update_own" on public.vendor_orders for update using (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())) with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()));

 drop policy if exists "notification_events_authenticated_insert" on public.notification_events;
create policy "notification_events_authenticated_insert" on public.notification_events for insert with check (auth.uid() is not null);
 drop policy if exists "notification_events_recipient_read" on public.notification_events;
create policy "notification_events_recipient_read" on public.notification_events for select using (
  recipient_email is null
  or lower(recipient_email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
);
