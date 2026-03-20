-- =====================================================
-- AI JEWELRY APP: VENDOR AUTH + LEADS MASTER SETUP
-- Safe to run in Supabase SQL Editor in sections.
-- =====================================================

create extension if not exists pgcrypto;

-- -----------------------------
-- profiles table support
-- -----------------------------
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists role text,
  add column if not exists updated_at timestamptz default now();

-- -----------------------------
-- vendors table support
-- -----------------------------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  business_name text,
  owner_name text,
  email text,
  phone text,
  country text,
  city text,
  website text,
  specialization text[],
  invite_code text unique,
  subscription_plan text default 'starter',
  subscription_status text default 'pending',
  stripe_account_id text,
  stripe_onboarding_complete boolean default false,
  payouts_enabled boolean default false,
  is_onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vendors
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists business_name text,
  add column if not exists owner_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists website text,
  add column if not exists specialization text[],
  add column if not exists invite_code text,
  add column if not exists subscription_plan text default 'starter',
  add column if not exists subscription_status text default 'pending',
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_complete boolean default false,
  add column if not exists payouts_enabled boolean default false,
  add column if not exists is_onboarded boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- -----------------------------
-- vendor leads support
-- -----------------------------
create table if not exists public.vendor_leads (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete cascade,
  customer_name text,
  customer_email text,
  customer_phone text,
  design_title text,
  design_summary text,
  design_image text,
  jewelry_type text,
  metal text,
  stone text,
  budget numeric,
  timeline text,
  notes text,
  status text default 'new',
  source text default 'vendor_invite',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vendor_leads
  add column if not exists vendor_id uuid references public.vendors(id) on delete cascade,
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists design_title text,
  add column if not exists design_summary text,
  add column if not exists design_image text,
  add column if not exists jewelry_type text,
  add column if not exists metal text,
  add column if not exists stone text,
  add column if not exists budget numeric,
  add column if not exists timeline text,
  add column if not exists notes text,
  add column if not exists status text default 'new',
  add column if not exists source text default 'vendor_invite',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- -----------------------------
-- indexes
-- -----------------------------
create index if not exists idx_vendors_user_id on public.vendors(user_id);
create index if not exists idx_vendors_invite_code on public.vendors(invite_code);
create index if not exists idx_vendor_leads_vendor_id on public.vendor_leads(vendor_id);
create index if not exists idx_vendor_leads_created_at on public.vendor_leads(created_at desc);

-- -----------------------------
-- automatic updated_at helper
-- -----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_vendors_updated_at on public.vendors;
create trigger set_vendors_updated_at
before update on public.vendors
for each row execute procedure public.set_updated_at();

drop trigger if exists set_vendor_leads_updated_at on public.vendor_leads;
create trigger set_vendor_leads_updated_at
before update on public.vendor_leads
for each row execute procedure public.set_updated_at();

-- -----------------------------
-- auto-create profile on signup
-- -----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'customer'))
  on conflict (id) do update
    set email = excluded.email,
        role = coalesce(public.profiles.role, excluded.role);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- -----------------------------
-- RLS
-- -----------------------------
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_leads enable row level security;

-- profiles policies
 drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

 drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

 drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- vendors policies
 drop policy if exists "vendors_select_own" on public.vendors;
create policy "vendors_select_own"
on public.vendors
for select
using (auth.uid() = user_id);

 drop policy if exists "vendors_insert_own" on public.vendors;
create policy "vendors_insert_own"
on public.vendors
for insert
with check (auth.uid() = user_id);

 drop policy if exists "vendors_update_own" on public.vendors;
create policy "vendors_update_own"
on public.vendors
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

 drop policy if exists "vendors_public_invite_read" on public.vendors;
create policy "vendors_public_invite_read"
on public.vendors
for select
using (true);

-- vendor leads policies
 drop policy if exists "vendor_leads_vendor_reads_own" on public.vendor_leads;
create policy "vendor_leads_vendor_reads_own"
on public.vendor_leads
for select
using (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_id
      and v.user_id = auth.uid()
  )
);

 drop policy if exists "vendor_leads_public_insert" on public.vendor_leads;
create policy "vendor_leads_public_insert"
on public.vendor_leads
for insert
with check (true);

 drop policy if exists "vendor_leads_vendor_update_own" on public.vendor_leads;
create policy "vendor_leads_vendor_update_own"
on public.vendor_leads
for update
using (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_id
      and v.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors v
    where v.id = vendor_id
      and v.user_id = auth.uid()
  )
);
