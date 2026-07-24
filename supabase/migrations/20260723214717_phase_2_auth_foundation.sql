create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

do $$
begin
  create type public.app_role as enum (
    'administrator',
    'staff',
    'accountant',
    'viewer'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_status as enum (
    'active',
    'inactive'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role public.app_role not null default 'viewer',
  status public.profile_status not null default 'active',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (length(trim(email)) > 0)
);

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists profiles_created_at_idx on public.profiles(created_at);

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  slogan text not null,
  ceo_name text not null,
  address text not null,
  primary_phone text not null,
  alternative_phone text,
  primary_email text not null,
  alternative_email text,
  tax_details jsonb not null default '{}'::jsonb,
  banking_details jsonb not null default '{}'::jsonb,
  ecocash_details jsonb not null default '{}'::jsonb,
  default_currency text not null default 'USD',
  default_tax_rate numeric(7,4) not null default 0,
  default_quote_terms text not null default '',
  default_invoice_terms text not null default '',
  quote_prefix text not null default 'AVX-Q',
  invoice_prefix text not null default 'AVX-INV',
  receipt_prefix text not null default 'AVX-REC',
  land_listing_prefix text not null default 'AVX-LAND',
  google_maps_query text,
  google_maps_embed_url text,
  social_links jsonb not null default '{}'::jsonb,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint company_settings_company_name_not_blank check (length(trim(company_name)) > 0),
  constraint company_settings_primary_email_not_blank check (length(trim(primary_email)) > 0),
  constraint company_settings_primary_phone_not_blank check (length(trim(primary_phone)) > 0),
  constraint company_settings_default_tax_rate_non_negative check (default_tax_rate >= 0)
);

create index if not exists company_settings_updated_by_idx
  on public.company_settings(updated_by);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint activity_logs_action_not_blank check (length(trim(action)) > 0),
  constraint activity_logs_resource_type_not_blank check (length(trim(resource_type)) > 0),
  constraint activity_logs_summary_not_blank check (length(trim(summary)) > 0)
);

create index if not exists activity_logs_actor_id_idx
  on public.activity_logs(actor_id);
create index if not exists activity_logs_resource_idx
  on public.activity_logs(resource_type, resource_id);
create index if not exists activity_logs_created_at_idx
  on public.activity_logs(created_at desc);
create index if not exists activity_logs_action_idx
  on public.activity_logs(action);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists company_settings_set_updated_at on public.company_settings;
create trigger company_settings_set_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();

create or replace function app_private.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'active'
  limit 1
$$;

revoke all on function app_private.current_user_role() from public, anon;
grant execute on function app_private.current_user_role() to authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing_profile_count integer;
begin
  select count(*) into existing_profile_count from public.profiles;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status
  )
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      ),
      ''
    ),
    case
      when existing_profile_count = 0 then 'administrator'::public.app_role
      else 'viewer'::public.app_role
    end,
    'active'::public.profile_status
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

with existing_users as (
  select
    users.id,
    users.email,
    users.raw_user_meta_data,
    row_number() over (order by users.created_at, users.id) as user_position
  from auth.users
)
insert into public.profiles (
  id,
  email,
  full_name,
  role,
  status
)
select
  existing_users.id,
  coalesce(existing_users.email, ''),
  nullif(
    coalesce(
      existing_users.raw_user_meta_data ->> 'full_name',
      existing_users.raw_user_meta_data ->> 'name',
      ''
    ),
    ''
  ),
  case
    when existing_users.user_position = 1
      and not exists (select 1 from public.profiles)
      then 'administrator'::public.app_role
    else 'viewer'::public.app_role
  end,
  'active'::public.profile_status
from existing_users
on conflict (id) do nothing;

insert into public.company_settings (
  id,
  company_name,
  slogan,
  ceo_name,
  address,
  primary_phone,
  alternative_phone,
  primary_email,
  alternative_email,
  default_currency,
  default_tax_rate,
  default_quote_terms,
  default_invoice_terms,
  quote_prefix,
  invoice_prefix,
  receipt_prefix,
  land_listing_prefix,
  google_maps_query,
  google_maps_embed_url,
  logo_path
)
values (
  '00000000-0000-0000-0000-000000000001',
  'Averex Land Solutions',
  'Enhance Your True Land Value',
  'B. Mungofa',
  'Lot 18 Doornfontein, 24km peg Harare-Bulawayo Road, Harare, Zimbabwe',
  '+263 774 041 144',
  '+263 717 515 513',
  'averexls@gmail.com',
  'brynermungofa@gmail.com',
  'USD',
  0,
  'Quotes remain subject to verification, scope confirmation and written acceptance.',
  'Invoices are payable according to the agreed payment terms shown on each invoice.',
  'AVX-Q',
  'AVX-INV',
  'AVX-REC',
  'AVX-LAND',
  'Lot 18 Doornfontein 24km peg Harare Bulawayo Road Harare Zimbabwe',
  'https://www.google.com/maps?q=Lot%2018%20Doornfontein%2024km%20peg%20Harare%20Bulawayo%20Road%20Harare&output=embed',
  '/assets/images/averex-logo.png'
)
on conflict (id) do update
  set company_name = excluded.company_name,
      slogan = excluded.slogan,
      ceo_name = excluded.ceo_name,
      address = excluded.address,
      primary_phone = excluded.primary_phone,
      alternative_phone = excluded.alternative_phone,
      primary_email = excluded.primary_email,
      alternative_email = excluded.alternative_email,
      default_currency = excluded.default_currency,
      default_tax_rate = excluded.default_tax_rate,
      quote_prefix = excluded.quote_prefix,
      invoice_prefix = excluded.invoice_prefix,
      receipt_prefix = excluded.receipt_prefix,
      land_listing_prefix = excluded.land_listing_prefix,
      google_maps_query = excluded.google_maps_query,
      google_maps_embed_url = excluded.google_maps_embed_url,
      logo_path = excluded.logo_path,
      updated_at = now();

alter table public.profiles enable row level security;
alter table public.company_settings enable row level security;
alter table public.activity_logs enable row level security;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.company_settings to authenticated;
grant select, insert on public.activity_logs to authenticated;

drop policy if exists "profiles_select_own_profile" on public.profiles;
create policy "profiles_select_own_profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_select_administrator" on public.profiles;
create policy "profiles_select_administrator"
  on public.profiles
  for select
  to authenticated
  using (app_private.current_user_role() = 'administrator');

drop policy if exists "profiles_update_administrator" on public.profiles;
create policy "profiles_update_administrator"
  on public.profiles
  for update
  to authenticated
  using (app_private.current_user_role() = 'administrator')
  with check (app_private.current_user_role() = 'administrator');

drop policy if exists "company_settings_select_authenticated_staff" on public.company_settings;
create policy "company_settings_select_authenticated_staff"
  on public.company_settings
  for select
  to authenticated
  using (app_private.current_user_role() is not null);

drop policy if exists "company_settings_insert_administrator" on public.company_settings;
create policy "company_settings_insert_administrator"
  on public.company_settings
  for insert
  to authenticated
  with check (app_private.current_user_role() = 'administrator');

drop policy if exists "company_settings_update_administrator" on public.company_settings;
create policy "company_settings_update_administrator"
  on public.company_settings
  for update
  to authenticated
  using (app_private.current_user_role() = 'administrator')
  with check (app_private.current_user_role() = 'administrator');

drop policy if exists "company_settings_delete_administrator" on public.company_settings;
create policy "company_settings_delete_administrator"
  on public.company_settings
  for delete
  to authenticated
  using (app_private.current_user_role() = 'administrator');

drop policy if exists "activity_logs_select_authenticated_staff" on public.activity_logs;
create policy "activity_logs_select_authenticated_staff"
  on public.activity_logs
  for select
  to authenticated
  using (app_private.current_user_role() is not null);

drop policy if exists "activity_logs_insert_operational_staff" on public.activity_logs;
create policy "activity_logs_insert_operational_staff"
  on public.activity_logs
  for insert
  to authenticated
  with check (
    app_private.current_user_role() in ('administrator', 'staff', 'accountant')
    and (actor_id is null or actor_id = (select auth.uid()))
  );
