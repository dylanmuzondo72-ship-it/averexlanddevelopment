-- Private media integrity: no new public reads and no production data creation.
-- Run after the Phase 8 table migration; do not edit previously applied migrations.
revoke all on public.land_media from anon;

create or replace function app_private.audit_land_media()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  if auth.uid() is null or not app_private.land_user_can_edit() then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.development_id is distinct from old.development_id
      or new.land_unit_id is distinct from old.land_unit_id then
      raise exception 'Media identity and parent cannot be changed' using errcode = '22023';
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  else
    new.created_by := auth.uid();
    new.created_at := now();
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  if new.is_cover and (new.storage_bucket <> 'land-media' or new.archived_at is not null) then
    raise exception 'Only active images can be covers' using errcode = '22023';
  end if;
  insert into public.activity_logs(actor_id, action, resource_type, resource_id, summary)
  values(auth.uid(), case when tg_op = 'INSERT' then 'land.media.created'
    when new.archived_at is not null and old.archived_at is null then 'land.media.archived'
    else 'land.media.updated' end, 'land_media', new.id, 'Land media record changed');
  return new;
end;
$$;
revoke all on function app_private.audit_land_media() from public, anon, authenticated;
create trigger land_media_audit before insert or update on public.land_media
for each row execute function app_private.audit_land_media();

create or replace function public.set_land_media_cover(target_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare item public.land_media;
begin
  if not app_private.land_user_can_edit() then raise exception 'permission denied' using errcode='42501'; end if;
  select * into item from public.land_media where id=target_id and archived_at is null;
  if not found or item.storage_bucket <> 'land-media' then raise exception 'Active image not found'; end if;
  -- Serialize changes for this parent; both updates commit or roll back together.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(coalesce(item.development_id,item.land_unit_id)::text,0));
  perform 1 from public.land_media where id=target_id and archived_at is null for update;
  if not found then raise exception 'Active image not found'; end if;
  update public.land_media set is_cover=false
    where archived_at is null and is_cover and
    (development_id=item.development_id or land_unit_id=item.land_unit_id);
  update public.land_media set is_cover=true where id=target_id;
end;
$$;
revoke all on function public.set_land_media_cover(uuid) from public, anon, authenticated;
grant execute on function public.set_land_media_cover(uuid) to authenticated;

create or replace function public.move_land_media(target_id uuid, move_direction integer)
returns void language plpgsql security invoker set search_path = '' as $$
declare item public.land_media; ids uuid[]; position integer; neighbor integer; swap_id uuid;
begin
  if not app_private.land_user_can_edit() then raise exception 'permission denied' using errcode='42501'; end if;
  if move_direction not in (-1,1) or move_direction is null then raise exception 'Invalid direction'; end if;
  select * into item from public.land_media where id=target_id and archived_at is null;
  if not found then raise exception 'Media not found'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(coalesce(item.development_id,item.land_unit_id)::text,0));
  select array_agg(id order by sort_order,created_at,id) into ids
    from public.land_media where archived_at is null and storage_bucket=item.storage_bucket
    and (development_id=item.development_id or land_unit_id=item.land_unit_id);
  position := array_position(ids,target_id); neighbor := position+move_direction;
  if position is null or neighbor < 1 or neighbor > array_length(ids,1) then return; end if;
  swap_id := ids[position]; ids[position] := ids[neighbor]; ids[neighbor] := swap_id;
  -- Dense positions handle newly uploaded rows with identical default sort_order.
  update public.land_media m set sort_order=ordered.ordinality::integer-1
    from unnest(ids) with ordinality as ordered(id,ordinality) where m.id=ordered.id;
end;
$$;
revoke all on function public.move_land_media(uuid,integer) from public, anon, authenticated;
grant execute on function public.move_land_media(uuid,integer) to authenticated;
