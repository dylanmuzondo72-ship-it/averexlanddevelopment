create type public.land_development_status as enum ('draft','active','completed','archived');
create type public.land_unit_property_type as enum ('residential','commercial','industrial','agricultural','mixed_use','development','other');
create type public.land_unit_availability_status as enum ('draft','available','reserved','sold','unavailable','archived');
create type public.land_unit_verification_status as enum ('unverified','under_review','verified');

create table public.land_developments (
  id uuid primary key default gen_random_uuid(), reference_number text not null unique,
  name text not null, slug text not null unique, description text, development_type text not null,
  location text not null, address text, city_town text, province text, latitude numeric(9,6), longitude numeric(9,6),
  total_land_size numeric(18,4), land_size_unit text, currency text not null default 'USD',
  status public.land_development_status not null default 'draft', internal_notes text,
  created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint land_developments_archive_state check ((status='archived' and archived_at is not null) or (status<>'archived' and archived_at is null))
);
create table public.land_units (
  id uuid primary key default gen_random_uuid(), development_id uuid not null references public.land_developments(id),
  internal_reference text not null unique, stand_number text not null, slug text not null unique, title text, description text,
  property_type public.land_unit_property_type not null, location_description text, land_size numeric(18,4) not null,
  land_size_unit text not null, asking_price numeric(18,2), currency text not null default 'USD',
  availability_status public.land_unit_availability_status not null default 'draft',
  verification_status public.land_unit_verification_status not null default 'unverified', internal_notes text,
  created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint land_units_archive_state check ((availability_status='archived' and archived_at is not null) or (availability_status<>'archived' and archived_at is null)),
  constraint land_units_size_positive check (land_size > 0), constraint land_units_price_nonnegative check (asking_price is null or asking_price >= 0),
  unique(development_id, stand_number)
);
create table app_private.land_counters (counter_key text primary key, last_value bigint not null default 0);
insert into app_private.land_counters(counter_key) values ('development'),('unit') on conflict do nothing;
create index land_developments_status_idx on public.land_developments(status);
create index land_developments_location_idx on public.land_developments(location);
create index land_developments_created_idx on public.land_developments(created_at desc);
create index land_units_development_idx on public.land_units(development_id);
create index land_units_availability_idx on public.land_units(availability_status);
create index land_units_verification_idx on public.land_units(verification_status);
create index land_units_created_idx on public.land_units(created_at desc);

create or replace function app_private.next_land_reference(kind text) returns text language plpgsql security definer set search_path=public,app_private as $$
declare n bigint; prefix text;
begin if kind not in ('development','unit') then raise exception 'Unsupported land counter'; end if;
  update app_private.land_counters set last_value=last_value+1 where counter_key=kind returning last_value into n;
  prefix := case when kind='development' then 'AVX-DEV-' else 'AVX-LND-' end;
  return prefix || lpad(n::text,6,'0');
end $$;

create or replace function app_private.land_user_can_edit() returns boolean language sql stable security definer set search_path=public,app_private as $$
  select exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff'))
$$;
alter table public.land_developments enable row level security; alter table public.land_units enable row level security;
grant select,insert,update on public.land_developments, public.land_units to authenticated;
create policy land_developments_read on public.land_developments for select to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff','accountant','viewer')));
create policy land_developments_write on public.land_developments for all to authenticated using (app_private.land_user_can_edit()) with check (app_private.land_user_can_edit());
create policy land_units_read on public.land_units for select to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff','accountant','viewer')));
create policy land_units_write on public.land_units for all to authenticated using (app_private.land_user_can_edit()) with check (app_private.land_user_can_edit());

create or replace function public.create_land_development(new_name text,new_slug text,new_development_type text,new_location text,new_description text default null,new_address text default null,new_city_town text default null,new_province text default null,new_total_land_size numeric default null,new_land_size_unit text default null,new_internal_notes text default null) returns public.land_developments language plpgsql security invoker as $$ declare r public.land_developments; begin if not app_private.land_user_can_edit() then raise exception 'permission denied'; end if; insert into public.land_developments(reference_number,name,slug,development_type,location,description,address,city_town,province,total_land_size,land_size_unit,internal_notes,created_by,updated_by) values(app_private.next_land_reference('development'),trim(new_name),lower(trim(new_slug)),trim(new_development_type),trim(new_location),new_description,new_address,new_city_town,new_province,new_total_land_size,new_land_size_unit,new_internal_notes,auth.uid(),auth.uid()) returning * into r; insert into public.activity_logs(actor_id,action,resource_type,resource_id,summary) values(auth.uid(),'land.development.created','land_development',r.id,'Created '||r.reference_number); return r; end $$;
create or replace function public.create_land_unit(new_development_id uuid,new_stand_number text,new_slug text,new_property_type public.land_unit_property_type,new_land_size numeric,new_land_size_unit text,new_title text default null,new_description text default null,new_location_description text default null,new_asking_price numeric default null,new_currency text default 'USD',new_internal_notes text default null) returns public.land_units language plpgsql security invoker as $$ declare r public.land_units; begin if not app_private.land_user_can_edit() then raise exception 'permission denied'; end if; insert into public.land_units(internal_reference,development_id,stand_number,slug,property_type,land_size,land_size_unit,title,description,location_description,asking_price,currency,internal_notes,created_by,updated_by) values(app_private.next_land_reference('unit'),new_development_id,trim(new_stand_number),lower(trim(new_slug)),new_property_type,new_land_size,trim(new_land_size_unit),new_title,new_description,new_location_description,new_asking_price,new_currency,new_internal_notes,auth.uid(),auth.uid()) returning * into r; insert into public.activity_logs(actor_id,action,resource_type,resource_id,summary) values(auth.uid(),'land.unit.created','land_unit',r.id,'Created '||r.internal_reference); return r; end $$;
revoke all on function public.create_land_development(text,text,text,text,text,text,text,text,numeric,text,text) from public; revoke all on function public.create_land_unit(uuid,text,text,public.land_unit_property_type,numeric,text,text,text,text,numeric,text,text) from public;
grant execute on function public.create_land_development(text,text,text,text,text,text,text,text,numeric,text,text) to authenticated; grant execute on function public.create_land_unit(uuid,text,text,public.land_unit_property_type,numeric,text,text,text,text,numeric,text,text) to authenticated;
