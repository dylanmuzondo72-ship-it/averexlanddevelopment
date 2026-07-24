drop function if exists public.search_clients(
  text,
  public.client_status,
  public.client_type,
  text,
  integer,
  integer
);

create or replace function app_private.search_clients(
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
  assigned_name text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz,
  total_count bigint
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

  return query
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
    coalesce(assigned.full_name, assigned.email),
    c.created_by,
    c.updated_by,
    c.created_at,
    c.updated_at,
    c.archived_at,
    count(*) over()
  from public.clients c
  left join public.profiles assigned on assigned.id = c.assigned_to
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
  offset greatest(coalesce(page_offset, 0), 0);
end;
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
  assigned_name text,
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
  select *
  from app_private.search_clients(
    search_term,
    status_filter,
    type_filter,
    sort_order,
    page_size,
    page_offset
  )
$$;

create or replace function app_private.get_client_details(
  target_client_id uuid
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
  assigned_name text,
  created_by uuid,
  created_by_name text,
  updated_by uuid,
  updated_by_name text,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz
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

  return query
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
    coalesce(assigned.full_name, assigned.email),
    c.created_by,
    coalesce(creator.full_name, creator.email),
    c.updated_by,
    coalesce(updater.full_name, updater.email),
    c.created_at,
    c.updated_at,
    c.archived_at
  from public.clients c
  left join public.profiles assigned on assigned.id = c.assigned_to
  left join public.profiles creator on creator.id = c.created_by
  left join public.profiles updater on updater.id = c.updated_by
  where c.id = target_client_id;
end;
$$;

create or replace function public.get_client_details(
  target_client_id uuid
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
  assigned_name text,
  created_by uuid,
  created_by_name text,
  updated_by uuid,
  updated_by_name text,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select *
  from app_private.get_client_details(target_client_id)
$$;

revoke all on function app_private.search_clients(
  text,
  public.client_status,
  public.client_type,
  text,
  integer,
  integer
) from public, anon, authenticated;
revoke all on function app_private.get_client_details(uuid)
  from public, anon, authenticated;

grant execute on function app_private.search_clients(
  text,
  public.client_status,
  public.client_type,
  text,
  integer,
  integer
) to authenticated;
grant execute on function app_private.get_client_details(uuid)
  to authenticated;

revoke all on function public.search_clients(
  text,
  public.client_status,
  public.client_type,
  text,
  integer,
  integer
) from public, anon;
revoke all on function public.get_client_details(uuid)
  from public, anon;

grant execute on function public.search_clients(
  text,
  public.client_status,
  public.client_type,
  text,
  integer,
  integer
) to authenticated;
grant execute on function public.get_client_details(uuid)
  to authenticated;
