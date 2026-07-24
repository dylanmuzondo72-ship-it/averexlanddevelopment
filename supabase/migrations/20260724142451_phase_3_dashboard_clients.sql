do $$
begin
  create type public.client_type as enum ('individual', 'company');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.client_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end $$;

alter table public.company_settings
  add column if not exists client_prefix text not null default 'AVX-CL';

do $$
begin
  alter table public.company_settings
    add constraint company_settings_client_prefix_valid
    check (
      client_prefix = upper(trim(client_prefix))
      and client_prefix ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'
    );
exception
  when duplicate_object then null;
end $$;

create sequence if not exists public.client_reference_seq
  as bigint
  start with 1
  increment by 1
  minvalue 1
  no cycle;

revoke all on sequence public.client_reference_seq from public, anon, authenticated;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  client_reference text not null,
  client_type public.client_type not null,
  display_name text not null,
  company_name text,
  contact_person text,
  email text,
  phone text not null,
  alternative_phone text,
  physical_address text,
  billing_address text,
  tax_number text,
  notes text,
  status public.client_status not null default 'active',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint clients_reference_not_blank
    check (length(trim(client_reference)) > 0),
  constraint clients_display_name_not_blank
    check (length(trim(display_name)) > 0),
  constraint clients_phone_not_blank
    check (length(trim(phone)) > 0),
  constraint clients_company_name_required
    check (
      client_type <> 'company'
      or (company_name is not null and length(trim(company_name)) > 0)
    ),
  constraint clients_email_not_blank
    check (email is null or length(trim(email)) > 0),
  constraint clients_archive_state_consistent
    check (
      (status = 'archived' and archived_at is not null)
      or (status = 'active' and archived_at is null)
    )
);

create unique index if not exists clients_reference_unique_idx
  on public.clients(client_reference);
create index if not exists clients_display_name_idx
  on public.clients(lower(display_name));
create index if not exists clients_email_idx
  on public.clients(lower(email))
  where email is not null;
create index if not exists clients_phone_idx
  on public.clients(phone);
create index if not exists clients_status_idx
  on public.clients(status);
create index if not exists clients_type_idx
  on public.clients(client_type);
create index if not exists clients_assigned_to_idx
  on public.clients(assigned_to);
create index if not exists clients_created_at_idx
  on public.clients(created_at desc);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create or replace function app_private.require_active_role(
  allowed_roles public.app_role[]
)
returns public.app_role
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  select p.role
  into actor_role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'active';

  if actor_role is null or not (actor_role = any(allowed_roles)) then
    raise exception 'You do not have permission to perform this action'
      using errcode = '42501';
  end if;

  return actor_role;
end;
$$;

revoke all on function app_private.require_active_role(public.app_role[])
  from public, anon, authenticated;

create or replace function app_private.write_activity(
  activity_action text,
  activity_resource_type text,
  activity_resource_id uuid,
  activity_summary text,
  activity_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authenticated activity actor required'
      using errcode = '42501';
  end if;

  insert into public.activity_logs (
    actor_id,
    action,
    resource_type,
    resource_id,
    summary,
    metadata
  )
  values (
    (select auth.uid()),
    trim(activity_action),
    trim(activity_resource_type),
    activity_resource_id,
    trim(activity_summary),
    coalesce(activity_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function app_private.write_activity(text, text, uuid, text, jsonb)
  from public, anon, authenticated;

create or replace function app_private.changed_field_names(
  old_row jsonb,
  new_row jsonb,
  ignored_fields text[] default array[]::text[]
)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(changed.key order by changed.key), '[]'::jsonb)
  from (
    select key
    from jsonb_object_keys(coalesce(old_row, '{}'::jsonb) || coalesce(new_row, '{}'::jsonb)) key
    where not (key = any(ignored_fields))
      and coalesce(old_row -> key, 'null'::jsonb)
        is distinct from coalesce(new_row -> key, 'null'::jsonb)
  ) changed
$$;

revoke all on function app_private.changed_field_names(jsonb, jsonb, text[])
  from public, anon, authenticated;

create or replace function app_private.assign_client_reference()
returns trigger
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  reference_prefix text;
  reference_number bigint;
begin
  select cs.client_prefix
  into reference_prefix
  from public.company_settings cs
  order by cs.created_at
  limit 1;

  reference_prefix := coalesce(nullif(trim(reference_prefix), ''), 'AVX-CL');
  reference_number := nextval('public.client_reference_seq');
  new.client_reference :=
    reference_prefix || '-' || lpad(reference_number::text, 6, '0');

  return new;
end;
$$;

revoke all on function app_private.assign_client_reference()
  from public, anon, authenticated;

drop trigger if exists clients_assign_reference on public.clients;
create trigger clients_assign_reference
  before insert on public.clients
  for each row execute function app_private.assign_client_reference();

create or replace function app_private.audit_client_changes()
returns trigger
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  audit_action text;
  audit_summary text;
  audit_metadata jsonb;
begin
  if tg_op = 'INSERT' then
    audit_action := 'client.created';
    audit_summary := 'Created client ' || new.client_reference;
    audit_metadata := jsonb_build_object(
      'client_reference', new.client_reference,
      'client_type', new.client_type
    );
  elsif old.status <> new.status and new.status = 'archived' then
    audit_action := 'client.archived';
    audit_summary := 'Archived client ' || new.client_reference;
    audit_metadata := jsonb_build_object(
      'client_reference', new.client_reference,
      'previous_status', old.status,
      'new_status', new.status
    );
  elsif old.status <> new.status and new.status = 'active' then
    audit_action := 'client.restored';
    audit_summary := 'Restored client ' || new.client_reference;
    audit_metadata := jsonb_build_object(
      'client_reference', new.client_reference,
      'previous_status', old.status,
      'new_status', new.status
    );
  else
    audit_action := 'client.updated';
    audit_summary := 'Updated client ' || new.client_reference;
    audit_metadata := jsonb_build_object(
      'client_reference', new.client_reference,
      'changed_fields',
      app_private.changed_field_names(
        to_jsonb(old),
        to_jsonb(new),
        array['updated_at', 'updated_by']
      )
    );
  end if;

  perform app_private.write_activity(
    audit_action,
    'client',
    new.id,
    audit_summary,
    audit_metadata
  );

  return new;
end;
$$;

revoke all on function app_private.audit_client_changes()
  from public, anon, authenticated;

drop trigger if exists clients_audit_changes on public.clients;
create trigger clients_audit_changes
  after insert or update on public.clients
  for each row execute function app_private.audit_client_changes();

create or replace function app_private.create_client(
  new_client_type public.client_type,
  new_display_name text,
  new_company_name text,
  new_contact_person text,
  new_email text,
  new_phone text,
  new_alternative_phone text,
  new_physical_address text,
  new_billing_address text,
  new_tax_number text,
  new_notes text,
  new_assigned_to uuid
)
returns public.clients
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
  current_user_id uuid := (select auth.uid());
  assigned_profile_id uuid;
  created_client public.clients;
begin
  actor_role := app_private.require_active_role(
    array['administrator', 'staff']::public.app_role[]
  );

  if actor_role = 'staff' then
    assigned_profile_id := current_user_id;
  else
    assigned_profile_id := new_assigned_to;
  end if;

  if assigned_profile_id is not null and not exists (
    select 1
    from public.profiles p
    where p.id = assigned_profile_id
      and p.status = 'active'
  ) then
    raise exception 'Assigned staff profile is not active'
      using errcode = '23514';
  end if;

  insert into public.clients (
    client_reference,
    client_type,
    display_name,
    company_name,
    contact_person,
    email,
    phone,
    alternative_phone,
    physical_address,
    billing_address,
    tax_number,
    notes,
    assigned_to,
    created_by,
    updated_by
  )
  values (
    'pending',
    new_client_type,
    trim(new_display_name),
    nullif(trim(new_company_name), ''),
    nullif(trim(new_contact_person), ''),
    nullif(lower(trim(new_email)), ''),
    trim(new_phone),
    nullif(trim(new_alternative_phone), ''),
    nullif(trim(new_physical_address), ''),
    nullif(trim(new_billing_address), ''),
    nullif(trim(new_tax_number), ''),
    nullif(trim(new_notes), ''),
    assigned_profile_id,
    current_user_id,
    current_user_id
  )
  returning * into created_client;

  return created_client;
end;
$$;

create or replace function app_private.update_client(
  target_client_id uuid,
  new_client_type public.client_type,
  new_display_name text,
  new_company_name text,
  new_contact_person text,
  new_email text,
  new_phone text,
  new_alternative_phone text,
  new_physical_address text,
  new_billing_address text,
  new_tax_number text,
  new_notes text,
  new_assigned_to uuid
)
returns public.clients
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
  current_client public.clients;
  assigned_profile_id uuid;
  updated_client public.clients;
begin
  actor_role := app_private.require_active_role(
    array['administrator', 'staff']::public.app_role[]
  );

  select *
  into current_client
  from public.clients
  where id = target_client_id
  for update;

  if not found then
    raise exception 'Client not found'
      using errcode = 'P0002';
  end if;

  if actor_role = 'staff' and current_client.status <> 'active' then
    raise exception 'Staff may only edit active clients'
      using errcode = '42501';
  end if;

  assigned_profile_id := case
    when actor_role = 'administrator' then new_assigned_to
    else current_client.assigned_to
  end;

  if assigned_profile_id is not null and not exists (
    select 1
    from public.profiles p
    where p.id = assigned_profile_id
      and p.status = 'active'
  ) then
    raise exception 'Assigned staff profile is not active'
      using errcode = '23514';
  end if;

  update public.clients
  set client_type = new_client_type,
      display_name = trim(new_display_name),
      company_name = nullif(trim(new_company_name), ''),
      contact_person = nullif(trim(new_contact_person), ''),
      email = nullif(lower(trim(new_email)), ''),
      phone = trim(new_phone),
      alternative_phone = nullif(trim(new_alternative_phone), ''),
      physical_address = nullif(trim(new_physical_address), ''),
      billing_address = nullif(trim(new_billing_address), ''),
      tax_number = nullif(trim(new_tax_number), ''),
      notes = nullif(trim(new_notes), ''),
      assigned_to = assigned_profile_id,
      updated_by = (select auth.uid())
  where id = target_client_id
  returning * into updated_client;

  return updated_client;
end;
$$;

create or replace function app_private.set_client_archived(
  target_client_id uuid,
  should_archive boolean
)
returns public.clients
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  updated_client public.clients;
begin
  perform app_private.require_active_role(
    array['administrator']::public.app_role[]
  );

  update public.clients
  set status = case
        when should_archive then 'archived'::public.client_status
        else 'active'::public.client_status
      end,
      archived_at = case when should_archive then now() else null end,
      updated_by = (select auth.uid())
  where id = target_client_id
  returning * into updated_client;

  if updated_client.id is null then
    raise exception 'Client not found'
      using errcode = 'P0002';
  end if;

  return updated_client;
end;
$$;

create or replace function app_private.admin_update_profile(
  target_profile_id uuid,
  new_full_name text,
  new_phone text,
  new_role public.app_role,
  new_status public.profile_status
)
returns public.profiles
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_profile public.profiles;
  updated_profile public.profiles;
  remaining_admins integer;
begin
  perform app_private.require_active_role(
    array['administrator']::public.app_role[]
  );
  perform pg_advisory_xact_lock(hashtext('averex-active-administrator'));

  select *
  into current_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if not found then
    raise exception 'Staff profile not found'
      using errcode = 'P0002';
  end if;

  if target_profile_id = (select auth.uid()) and new_status = 'inactive' then
    raise exception 'You cannot deactivate your current account'
      using errcode = '23514';
  end if;

  if current_profile.role = 'administrator'
    and current_profile.status = 'active'
    and (new_role <> 'administrator' or new_status <> 'active') then
    select count(*)
    into remaining_admins
    from public.profiles p
    where p.role = 'administrator'
      and p.status = 'active'
      and p.id <> target_profile_id;

    if remaining_admins = 0 then
      raise exception 'The final active administrator cannot be changed'
        using errcode = '23514';
    end if;
  end if;

  update public.profiles
  set full_name = nullif(trim(new_full_name), ''),
      phone = nullif(trim(new_phone), ''),
      role = new_role,
      status = new_status
  where id = target_profile_id
  returning * into updated_profile;

  if current_profile.full_name is distinct from updated_profile.full_name
    or current_profile.phone is distinct from updated_profile.phone then
    perform app_private.write_activity(
      'profile.updated',
      'profile',
      updated_profile.id,
      'Updated staff profile details',
      jsonb_build_object(
        'changed_fields',
        app_private.changed_field_names(
          to_jsonb(current_profile),
          to_jsonb(updated_profile),
          array['updated_at', 'role', 'status']
        )
      )
    );
  end if;

  if current_profile.role is distinct from updated_profile.role then
    perform app_private.write_activity(
      'profile.role_changed',
      'profile',
      updated_profile.id,
      'Changed staff profile role',
      jsonb_build_object(
        'previous_role', current_profile.role,
        'new_role', updated_profile.role
      )
    );
  end if;

  if current_profile.status is distinct from updated_profile.status then
    perform app_private.write_activity(
      case
        when updated_profile.status = 'active'
          then 'profile.activated'
        else 'profile.deactivated'
      end,
      'profile',
      updated_profile.id,
      case
        when updated_profile.status = 'active'
          then 'Activated staff profile'
        else 'Deactivated staff profile'
      end,
      jsonb_build_object(
        'previous_status', current_profile.status,
        'new_status', updated_profile.status
      )
    );
  end if;

  return updated_profile;
end;
$$;

create or replace function app_private.touch_profile_last_seen()
returns timestamptz
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  seen_at timestamptz;
begin
  perform app_private.require_active_role(
    array[
      'administrator',
      'staff',
      'accountant',
      'viewer'
    ]::public.app_role[]
  );

  update public.profiles
  set last_seen_at = now()
  where id = (select auth.uid())
    and (
      last_seen_at is null
      or last_seen_at < now() - interval '15 minutes'
    )
  returning last_seen_at into seen_at;

  return coalesce(seen_at, (
    select p.last_seen_at
    from public.profiles p
    where p.id = (select auth.uid())
  ));
end;
$$;

create or replace function app_private.update_company_settings(
  target_settings_id uuid,
  new_company_name text,
  new_slogan text,
  new_ceo_name text,
  new_address text,
  new_primary_phone text,
  new_alternative_phone text,
  new_primary_email text,
  new_alternative_email text,
  new_default_currency text,
  new_default_tax_rate numeric,
  new_default_quote_terms text,
  new_default_invoice_terms text,
  new_quote_prefix text,
  new_invoice_prefix text,
  new_receipt_prefix text,
  new_land_listing_prefix text,
  new_client_prefix text,
  new_google_maps_query text,
  new_google_maps_embed_url text,
  new_social_links jsonb,
  new_tax_details jsonb,
  new_banking_details jsonb,
  new_ecocash_details jsonb,
  new_logo_path text
)
returns public.company_settings
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  previous_settings public.company_settings;
  updated_settings public.company_settings;
begin
  perform app_private.require_active_role(
    array['administrator']::public.app_role[]
  );

  select *
  into previous_settings
  from public.company_settings
  where id = target_settings_id
  for update;

  if not found then
    raise exception 'Company settings not found'
      using errcode = 'P0002';
  end if;

  update public.company_settings
  set company_name = trim(new_company_name),
      slogan = trim(new_slogan),
      ceo_name = trim(new_ceo_name),
      address = trim(new_address),
      primary_phone = trim(new_primary_phone),
      alternative_phone = nullif(trim(new_alternative_phone), ''),
      primary_email = lower(trim(new_primary_email)),
      alternative_email = nullif(lower(trim(new_alternative_email)), ''),
      default_currency = upper(trim(new_default_currency)),
      default_tax_rate = new_default_tax_rate,
      default_quote_terms = trim(new_default_quote_terms),
      default_invoice_terms = trim(new_default_invoice_terms),
      quote_prefix = upper(trim(new_quote_prefix)),
      invoice_prefix = upper(trim(new_invoice_prefix)),
      receipt_prefix = upper(trim(new_receipt_prefix)),
      land_listing_prefix = upper(trim(new_land_listing_prefix)),
      client_prefix = upper(trim(new_client_prefix)),
      google_maps_query = nullif(trim(new_google_maps_query), ''),
      google_maps_embed_url = nullif(trim(new_google_maps_embed_url), ''),
      social_links = coalesce(new_social_links, '{}'::jsonb),
      tax_details = coalesce(new_tax_details, '{}'::jsonb),
      banking_details = coalesce(new_banking_details, '{}'::jsonb),
      ecocash_details = coalesce(new_ecocash_details, '{}'::jsonb),
      logo_path = nullif(trim(new_logo_path), ''),
      updated_by = (select auth.uid())
  where id = target_settings_id
  returning * into updated_settings;

  perform app_private.write_activity(
    'company_settings.updated',
    'company_settings',
    updated_settings.id,
    'Updated company settings',
    jsonb_build_object(
      'changed_fields',
      app_private.changed_field_names(
        to_jsonb(previous_settings),
        to_jsonb(updated_settings),
        array['updated_at', 'updated_by']
      )
    )
  );

  return updated_settings;
end;
$$;

revoke all on function app_private.create_client(
  public.client_type, text, text, text, text, text, text, text, text, text,
  text, uuid
) from public, anon, authenticated;
revoke all on function app_private.update_client(
  uuid, public.client_type, text, text, text, text, text, text, text, text,
  text, text, uuid
) from public, anon, authenticated;
revoke all on function app_private.set_client_archived(uuid, boolean)
  from public, anon, authenticated;
revoke all on function app_private.admin_update_profile(
  uuid, text, text, public.app_role, public.profile_status
) from public, anon, authenticated;
revoke all on function app_private.touch_profile_last_seen()
  from public, anon, authenticated;
revoke all on function app_private.update_company_settings(
  uuid, text, text, text, text, text, text, text, text, text, numeric, text,
  text, text, text, text, text, text, text, text, jsonb, jsonb, jsonb, jsonb,
  text
) from public, anon, authenticated;

grant execute on function app_private.create_client(
  public.client_type, text, text, text, text, text, text, text, text, text,
  text, uuid
) to authenticated;
grant execute on function app_private.update_client(
  uuid, public.client_type, text, text, text, text, text, text, text, text,
  text, text, uuid
) to authenticated;
grant execute on function app_private.set_client_archived(uuid, boolean)
  to authenticated;
grant execute on function app_private.admin_update_profile(
  uuid, text, text, public.app_role, public.profile_status
) to authenticated;
grant execute on function app_private.touch_profile_last_seen()
  to authenticated;
grant execute on function app_private.update_company_settings(
  uuid, text, text, text, text, text, text, text, text, text, numeric, text,
  text, text, text, text, text, text, text, text, jsonb, jsonb, jsonb, jsonb,
  text
) to authenticated;

create or replace function public.create_client(
  new_client_type public.client_type,
  new_display_name text,
  new_company_name text default null,
  new_contact_person text default null,
  new_email text default null,
  new_phone text default '',
  new_alternative_phone text default null,
  new_physical_address text default null,
  new_billing_address text default null,
  new_tax_number text default null,
  new_notes text default null,
  new_assigned_to uuid default null
)
returns public.clients
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.create_client(
    new_client_type,
    new_display_name,
    new_company_name,
    new_contact_person,
    new_email,
    new_phone,
    new_alternative_phone,
    new_physical_address,
    new_billing_address,
    new_tax_number,
    new_notes,
    new_assigned_to
  )
$$;

create or replace function public.update_client(
  target_client_id uuid,
  new_client_type public.client_type,
  new_display_name text,
  new_company_name text default null,
  new_contact_person text default null,
  new_email text default null,
  new_phone text default '',
  new_alternative_phone text default null,
  new_physical_address text default null,
  new_billing_address text default null,
  new_tax_number text default null,
  new_notes text default null,
  new_assigned_to uuid default null
)
returns public.clients
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.update_client(
    target_client_id,
    new_client_type,
    new_display_name,
    new_company_name,
    new_contact_person,
    new_email,
    new_phone,
    new_alternative_phone,
    new_physical_address,
    new_billing_address,
    new_tax_number,
    new_notes,
    new_assigned_to
  )
$$;

create or replace function public.set_client_archived(
  target_client_id uuid,
  should_archive boolean
)
returns public.clients
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.set_client_archived(target_client_id, should_archive)
$$;

create or replace function public.admin_update_profile(
  target_profile_id uuid,
  new_full_name text,
  new_phone text,
  new_role public.app_role,
  new_status public.profile_status
)
returns public.profiles
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.admin_update_profile(
    target_profile_id,
    new_full_name,
    new_phone,
    new_role,
    new_status
  )
$$;

create or replace function public.touch_profile_last_seen()
returns timestamptz
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.touch_profile_last_seen()
$$;

create or replace function public.update_company_settings(
  target_settings_id uuid,
  new_company_name text,
  new_slogan text,
  new_ceo_name text,
  new_address text,
  new_primary_phone text,
  new_alternative_phone text,
  new_primary_email text,
  new_alternative_email text,
  new_default_currency text,
  new_default_tax_rate numeric,
  new_default_quote_terms text,
  new_default_invoice_terms text,
  new_quote_prefix text,
  new_invoice_prefix text,
  new_receipt_prefix text,
  new_land_listing_prefix text,
  new_client_prefix text,
  new_google_maps_query text,
  new_google_maps_embed_url text,
  new_social_links jsonb,
  new_tax_details jsonb,
  new_banking_details jsonb,
  new_ecocash_details jsonb,
  new_logo_path text
)
returns public.company_settings
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.update_company_settings(
    target_settings_id,
    new_company_name,
    new_slogan,
    new_ceo_name,
    new_address,
    new_primary_phone,
    new_alternative_phone,
    new_primary_email,
    new_alternative_email,
    new_default_currency,
    new_default_tax_rate,
    new_default_quote_terms,
    new_default_invoice_terms,
    new_quote_prefix,
    new_invoice_prefix,
    new_receipt_prefix,
    new_land_listing_prefix,
    new_client_prefix,
    new_google_maps_query,
    new_google_maps_embed_url,
    new_social_links,
    new_tax_details,
    new_banking_details,
    new_ecocash_details,
    new_logo_path
  )
$$;

create or replace function public.search_clients(
  search_term text default null,
  status_filter public.client_status default null,
  type_filter public.client_type default null,
  sort_order text default 'newest',
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  client_reference text,
  client_type public.client_type,
  display_name text,
  company_name text,
  contact_person text,
  email text,
  phone text,
  alternative_phone text,
  physical_address text,
  billing_address text,
  tax_number text,
  notes text,
  status public.client_status,
  assigned_to uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    c.id,
    c.client_reference,
    c.client_type,
    c.display_name,
    c.company_name,
    c.contact_person,
    c.email,
    c.phone,
    c.alternative_phone,
    c.physical_address,
    c.billing_address,
    c.tax_number,
    c.notes,
    c.status,
    c.assigned_to,
    c.created_by,
    c.updated_by,
    c.created_at,
    c.updated_at,
    c.archived_at,
    count(*) over() as total_count
  from public.clients c
  where (
      nullif(trim(search_term), '') is null
      or c.client_reference ilike '%' || trim(search_term) || '%'
      or c.display_name ilike '%' || trim(search_term) || '%'
      or coalesce(c.email, '') ilike '%' || trim(search_term) || '%'
      or c.phone ilike '%' || trim(search_term) || '%'
    )
    and (status_filter is null or c.status = status_filter)
    and (type_filter is null or c.client_type = type_filter)
  order by
    case when sort_order = 'oldest' then c.created_at end asc,
    case when sort_order = 'name' then lower(c.display_name) end asc,
    case when sort_order not in ('oldest', 'name') then c.created_at end desc,
    c.id
  limit greatest(1, least(coalesce(page_size, 20), 100))
  offset greatest(coalesce(page_offset, 0), 0)
$$;

create or replace function public.find_client_duplicates(
  candidate_email text default null,
  candidate_phone text default null,
  excluded_client_id uuid default null
)
returns table (
  id uuid,
  client_reference text,
  display_name text,
  email text,
  phone text
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select c.id, c.client_reference, c.display_name, c.email, c.phone
  from public.clients c
  where (excluded_client_id is null or c.id <> excluded_client_id)
    and (
      (
        nullif(lower(trim(candidate_email)), '') is not null
        and lower(c.email) = lower(trim(candidate_email))
      )
      or (
        nullif(regexp_replace(candidate_phone, '[^0-9]', '', 'g'), '') is not null
        and regexp_replace(c.phone, '[^0-9]', '', 'g')
          = regexp_replace(candidate_phone, '[^0-9]', '', 'g')
      )
    )
  order by c.created_at desc
  limit 5
$$;

create or replace function app_private.get_client_activity(
  target_client_id uuid,
  result_limit integer default 20
)
returns table (
  id uuid,
  actor_id uuid,
  actor_name text,
  action text,
  summary text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform app_private.require_active_role(
    array[
      'administrator',
      'staff',
      'accountant',
      'viewer'
    ]::public.app_role[]
  );

  if not exists (select 1 from public.clients c where c.id = target_client_id) then
    raise exception 'Client not found'
      using errcode = 'P0002';
  end if;

  return query
  select
    logs.id,
    logs.actor_id,
    coalesce(actor.full_name, actor.email, 'System'),
    logs.action,
    logs.summary,
    logs.created_at
  from public.activity_logs logs
  left join public.profiles actor on actor.id = logs.actor_id
  where logs.resource_type = 'client'
    and logs.resource_id = target_client_id
  order by logs.created_at desc
  limit greatest(1, least(coalesce(result_limit, 20), 100));
end;
$$;

create or replace function public.get_client_activity(
  target_client_id uuid,
  result_limit integer default 20
)
returns table (
  id uuid,
  actor_id uuid,
  actor_name text,
  action text,
  summary text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select *
  from app_private.get_client_activity(target_client_id, result_limit)
$$;

create or replace function app_private.search_staff_profiles(
  search_term text default null,
  role_filter public.app_role default null,
  status_filter public.profile_status default null,
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role public.app_role,
  status public.profile_status,
  last_seen_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform app_private.require_active_role(
    array['administrator']::public.app_role[]
  );

  return query
  select
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.role,
    p.status,
    p.last_seen_at,
    p.created_at,
    p.updated_at,
    count(*) over()
  from public.profiles p
  where (
      nullif(trim(search_term), '') is null
      or coalesce(p.full_name, '') ilike '%' || trim(search_term) || '%'
      or p.email ilike '%' || trim(search_term) || '%'
    )
    and (role_filter is null or p.role = role_filter)
    and (status_filter is null or p.status = status_filter)
  order by coalesce(p.full_name, p.email), p.id
  limit greatest(1, least(coalesce(page_size, 20), 100))
  offset greatest(coalesce(page_offset, 0), 0);
end;
$$;

create or replace function public.search_staff_profiles(
  search_term text default null,
  role_filter public.app_role default null,
  status_filter public.profile_status default null,
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role public.app_role,
  status public.profile_status,
  last_seen_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select *
  from app_private.search_staff_profiles(
    search_term,
    role_filter,
    status_filter,
    page_size,
    page_offset
  )
$$;

create or replace function app_private.search_activity_logs(
  search_term text default null,
  actor_filter uuid default null,
  action_filter text default null,
  resource_filter text default null,
  date_from timestamptz default null,
  date_to timestamptz default null,
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  actor_id uuid,
  actor_name text,
  action text,
  resource_type text,
  resource_id uuid,
  summary text,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
begin
  actor_role := app_private.require_active_role(
    array['administrator', 'accountant']::public.app_role[]
  );

  return query
  select
    logs.id,
    logs.actor_id,
    coalesce(actor.full_name, actor.email, 'System'),
    logs.action,
    logs.resource_type,
    logs.resource_id,
    logs.summary,
    case
      when actor_role = 'administrator' then logs.metadata
      else '{}'::jsonb
    end,
    logs.created_at,
    count(*) over()
  from public.activity_logs logs
  left join public.profiles actor on actor.id = logs.actor_id
  where (
      actor_role = 'administrator'
      or logs.resource_type in ('client', 'company_settings')
    )
    and (
      nullif(trim(search_term), '') is null
      or logs.summary ilike '%' || trim(search_term) || '%'
      or logs.action ilike '%' || trim(search_term) || '%'
      or coalesce(actor.full_name, actor.email, '') ilike
        '%' || trim(search_term) || '%'
    )
    and (actor_filter is null or logs.actor_id = actor_filter)
    and (
      nullif(trim(action_filter), '') is null
      or logs.action = trim(action_filter)
    )
    and (
      nullif(trim(resource_filter), '') is null
      or logs.resource_type = trim(resource_filter)
    )
    and (date_from is null or logs.created_at >= date_from)
    and (date_to is null or logs.created_at < date_to)
  order by logs.created_at desc, logs.id
  limit greatest(1, least(coalesce(page_size, 20), 100))
  offset greatest(coalesce(page_offset, 0), 0);
end;
$$;

create or replace function public.search_activity_logs(
  search_term text default null,
  actor_filter uuid default null,
  action_filter text default null,
  resource_filter text default null,
  date_from timestamptz default null,
  date_to timestamptz default null,
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  actor_id uuid,
  actor_name text,
  action text,
  resource_type text,
  resource_id uuid,
  summary text,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select *
  from app_private.search_activity_logs(
    search_term,
    actor_filter,
    action_filter,
    resource_filter,
    date_from,
    date_to,
    page_size,
    page_offset
  )
$$;

create or replace function app_private.dashboard_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
  overview jsonb;
begin
  actor_role := app_private.require_active_role(
    array[
      'administrator',
      'staff',
      'accountant',
      'viewer'
    ]::public.app_role[]
  );

  select jsonb_build_object(
    'active_clients',
      (select count(*) from public.clients c where c.status = 'active'),
    'archived_clients',
      (select count(*) from public.clients c where c.status = 'archived'),
    'active_staff_profiles',
      (select count(*) from public.profiles p where p.status = 'active'),
    'clients_created_this_month',
      (
        select count(*)
        from public.clients c
        where c.created_at >= date_trunc('month', now())
      ),
    'recent_activity',
      coalesce(
        (
          select jsonb_agg(activity_rows.item order by activity_rows.created_at desc)
          from (
            select
              logs.created_at,
              jsonb_build_object(
                'id', logs.id,
                'action', logs.action,
                'resource_type', logs.resource_type,
                'summary', logs.summary,
                'created_at', logs.created_at
              ) as item
            from public.activity_logs logs
            where actor_role = 'administrator'
              or (
                actor_role = 'accountant'
                and logs.resource_type in ('client', 'company_settings')
              )
              or (
                actor_role in ('staff', 'viewer')
                and logs.resource_type = 'client'
              )
            order by logs.created_at desc
            limit 5
          ) activity_rows
        ),
        '[]'::jsonb
      )
  )
  into overview;

  return overview;
end;
$$;

create or replace function public.dashboard_overview()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select app_private.dashboard_overview()
$$;

revoke all on function app_private.get_client_activity(uuid, integer)
  from public, anon, authenticated;
revoke all on function app_private.search_staff_profiles(
  text, public.app_role, public.profile_status, integer, integer
) from public, anon, authenticated;
revoke all on function app_private.search_activity_logs(
  text, uuid, text, text, timestamptz, timestamptz, integer, integer
) from public, anon, authenticated;
revoke all on function app_private.dashboard_overview()
  from public, anon, authenticated;

grant execute on function app_private.get_client_activity(uuid, integer)
  to authenticated;
grant execute on function app_private.search_staff_profiles(
  text, public.app_role, public.profile_status, integer, integer
) to authenticated;
grant execute on function app_private.search_activity_logs(
  text, uuid, text, text, timestamptz, timestamptz, integer, integer
) to authenticated;
grant execute on function app_private.dashboard_overview()
  to authenticated;

revoke all on function public.create_client(
  public.client_type, text, text, text, text, text, text, text, text, text,
  text, uuid
) from public, anon;
revoke all on function public.update_client(
  uuid, public.client_type, text, text, text, text, text, text, text, text,
  text, text, uuid
) from public, anon;
revoke all on function public.set_client_archived(uuid, boolean)
  from public, anon;
revoke all on function public.admin_update_profile(
  uuid, text, text, public.app_role, public.profile_status
) from public, anon;
revoke all on function public.touch_profile_last_seen()
  from public, anon;
revoke all on function public.update_company_settings(
  uuid, text, text, text, text, text, text, text, text, text, numeric, text,
  text, text, text, text, text, text, text, text, jsonb, jsonb, jsonb, jsonb,
  text
) from public, anon;
revoke all on function public.search_clients(
  text, public.client_status, public.client_type, text, integer, integer
) from public, anon;
revoke all on function public.find_client_duplicates(text, text, uuid)
  from public, anon;
revoke all on function public.get_client_activity(uuid, integer)
  from public, anon;
revoke all on function public.search_staff_profiles(
  text, public.app_role, public.profile_status, integer, integer
) from public, anon;
revoke all on function public.search_activity_logs(
  text, uuid, text, text, timestamptz, timestamptz, integer, integer
) from public, anon;
revoke all on function public.dashboard_overview()
  from public, anon;

grant execute on function public.create_client(
  public.client_type, text, text, text, text, text, text, text, text, text,
  text, uuid
) to authenticated;
grant execute on function public.update_client(
  uuid, public.client_type, text, text, text, text, text, text, text, text,
  text, text, uuid
) to authenticated;
grant execute on function public.set_client_archived(uuid, boolean)
  to authenticated;
grant execute on function public.admin_update_profile(
  uuid, text, text, public.app_role, public.profile_status
) to authenticated;
grant execute on function public.touch_profile_last_seen()
  to authenticated;
grant execute on function public.update_company_settings(
  uuid, text, text, text, text, text, text, text, text, text, numeric, text,
  text, text, text, text, text, text, text, text, jsonb, jsonb, jsonb, jsonb,
  text
) to authenticated;
grant execute on function public.search_clients(
  text, public.client_status, public.client_type, text, integer, integer
) to authenticated;
grant execute on function public.find_client_duplicates(text, text, uuid)
  to authenticated;
grant execute on function public.get_client_activity(uuid, integer)
  to authenticated;
grant execute on function public.search_staff_profiles(
  text, public.app_role, public.profile_status, integer, integer
) to authenticated;
grant execute on function public.search_activity_logs(
  text, uuid, text, text, timestamptz, timestamptz, integer, integer
) to authenticated;
grant execute on function public.dashboard_overview()
  to authenticated;

alter table public.clients enable row level security;

revoke all on public.clients from public, anon, authenticated;
grant select on public.clients to authenticated;

drop policy if exists "clients_select_active_profiles" on public.clients;
create policy "clients_select_active_profiles"
  on public.clients
  for select
  to authenticated
  using ((select app_private.current_user_role()) is not null);

revoke update on public.profiles from authenticated;
drop policy if exists "profiles_update_administrator" on public.profiles;

revoke insert, update, delete on public.company_settings from authenticated;
drop policy if exists "company_settings_select_authenticated_staff"
  on public.company_settings;
drop policy if exists "company_settings_insert_administrator"
  on public.company_settings;
drop policy if exists "company_settings_update_administrator"
  on public.company_settings;
drop policy if exists "company_settings_delete_administrator"
  on public.company_settings;

create policy "company_settings_select_administrator_accountant"
  on public.company_settings
  for select
  to authenticated
  using (
    (select app_private.current_user_role())
      in ('administrator', 'accountant')
  );

revoke all on public.activity_logs from authenticated;
grant select (
  id,
  actor_id,
  action,
  resource_type,
  resource_id,
  summary,
  created_at
) on public.activity_logs to authenticated;

drop policy if exists "activity_logs_select_authenticated_staff"
  on public.activity_logs;
drop policy if exists "activity_logs_insert_operational_staff"
  on public.activity_logs;

create policy "activity_logs_select_administrator"
  on public.activity_logs
  for select
  to authenticated
  using ((select app_private.current_user_role()) = 'administrator');

create policy "activity_logs_select_accountant_operations"
  on public.activity_logs
  for select
  to authenticated
  using (
    (select app_private.current_user_role()) = 'accountant'
    and resource_type in ('client', 'company_settings')
  );
