create or replace function app_private.write_land_activity(
  activity_action text,
  activity_resource_type text,
  activity_resource_id uuid,
  activity_summary text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not exists (
    select 1 from public.profiles
    where id = actor and status = 'active' and role in ('administrator', 'staff')
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if activity_action not in (
    'land.development.created', 'land.development.updated',
    'land.unit.created', 'land.unit.updated'
  ) or activity_resource_type not in ('land_development', 'land_unit')
     or activity_summary is null or length(trim(activity_summary)) = 0 then
    raise exception 'invalid land activity event' using errcode = '22023';
  end if;
  insert into public.activity_logs(actor_id, action, resource_type, resource_id, summary)
  values (actor, trim(activity_action), trim(activity_resource_type), activity_resource_id, trim(activity_summary));
end;
$$;

revoke all on function app_private.write_land_activity(text, text, uuid, text) from public, anon, authenticated;
grant execute on function app_private.write_land_activity(text, text, uuid, text) to authenticated;

create or replace function public.create_land_development(new_name text,new_slug text,new_development_type text,new_location text,new_description text default null,new_address text default null,new_city_town text default null,new_province text default null,new_total_land_size numeric default null,new_land_size_unit text default null,new_internal_notes text default null)
returns public.land_developments language plpgsql security invoker as $$
declare r public.land_developments;
begin
  if not app_private.land_user_can_edit() then raise exception 'permission denied'; end if;
  insert into public.land_developments(reference_number,name,slug,development_type,location,description,address,city_town,province,total_land_size,land_size_unit,internal_notes,created_by,updated_by)
  values(app_private.next_land_reference('development'),trim(new_name),lower(trim(new_slug)),trim(new_development_type),trim(new_location),new_description,new_address,new_city_town,new_province,new_total_land_size,new_land_size_unit,new_internal_notes,auth.uid(),auth.uid()) returning * into r;
  perform app_private.write_land_activity('land.development.created','land_development',r.id,'Created '||r.reference_number);
  return r;
end;
$$;

create or replace function public.create_land_unit(new_development_id uuid,new_stand_number text,new_slug text,new_property_type public.land_unit_property_type,new_land_size numeric,new_land_size_unit text,new_title text default null,new_description text default null,new_location_description text default null,new_asking_price numeric default null,new_currency text default 'USD',new_internal_notes text default null)
returns public.land_units language plpgsql security invoker as $$
declare r public.land_units;
begin
  if not app_private.land_user_can_edit() then raise exception 'permission denied'; end if;
  insert into public.land_units(internal_reference,development_id,stand_number,slug,property_type,land_size,land_size_unit,title,description,location_description,asking_price,currency,internal_notes,created_by,updated_by)
  values(app_private.next_land_reference('unit'),new_development_id,trim(new_stand_number),lower(trim(new_slug)),new_property_type,new_land_size,trim(new_land_size_unit),new_title,new_description,new_location_description,new_asking_price,new_currency,new_internal_notes,auth.uid(),auth.uid()) returning * into r;
  perform app_private.write_land_activity('land.unit.created','land_unit',r.id,'Created '||r.internal_reference);
  return r;
end;
$$;

create or replace function public.update_land_development(target_id uuid,new_name text,new_slug text,new_development_type text,new_location text,new_description text default null,new_address text default null,new_city_town text default null,new_province text default null,new_total_land_size numeric default null,new_land_size_unit text default null,new_internal_notes text default null,new_status public.land_development_status default null)
returns public.land_developments language plpgsql security invoker as $$
declare r public.land_developments;
begin
  if not app_private.land_user_can_edit() then raise exception 'permission denied'; end if;
  update public.land_developments set name=trim(new_name),slug=lower(trim(new_slug)),development_type=trim(new_development_type),location=trim(new_location),description=new_description,address=new_address,city_town=new_city_town,province=new_province,total_land_size=new_total_land_size,land_size_unit=new_land_size_unit,internal_notes=new_internal_notes,status=coalesce(new_status,status),updated_by=auth.uid(),updated_at=now(),archived_at=case when coalesce(new_status,status)='archived' then now() else null end where id=target_id returning * into r;
  if not found then raise exception 'Development not found'; end if;
  perform app_private.write_land_activity('land.development.updated','land_development',r.id,'Updated '||r.reference_number);
  return r;
end;
$$;

create or replace function public.update_land_unit(target_id uuid,new_stand_number text,new_slug text,new_property_type public.land_unit_property_type,new_land_size numeric,new_land_size_unit text,new_title text default null,new_description text default null,new_location_description text default null,new_asking_price numeric default null,new_currency text default 'USD',new_internal_notes text default null,new_availability_status public.land_unit_availability_status default null,new_verification_status public.land_unit_verification_status default null)
returns public.land_units language plpgsql security invoker as $$
declare r public.land_units;
begin
  if not app_private.land_user_can_edit() then raise exception 'permission denied'; end if;
  update public.land_units set stand_number=trim(new_stand_number),slug=lower(trim(new_slug)),property_type=new_property_type,land_size=new_land_size,land_size_unit=trim(new_land_size_unit),title=new_title,description=new_description,location_description=new_location_description,asking_price=new_asking_price,currency=new_currency,internal_notes=new_internal_notes,availability_status=coalesce(new_availability_status,availability_status),verification_status=coalesce(new_verification_status,verification_status),updated_by=auth.uid(),updated_at=now(),archived_at=case when coalesce(new_availability_status,availability_status)='archived' then now() else null end where id=target_id returning * into r;
  if not found then raise exception 'Land unit not found'; end if;
  perform app_private.write_land_activity('land.unit.updated','land_unit',r.id,'Updated '||r.internal_reference);
  return r;
end;
$$;
