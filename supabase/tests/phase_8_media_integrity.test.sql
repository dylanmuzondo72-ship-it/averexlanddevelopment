-- Transactional fixtures only. Run on an isolated test database, never production.
begin;
create temporary table media_test_users(label text, id uuid default gen_random_uuid());
insert into media_test_users(label) values ('administrator'),('staff'),('viewer'),('accountant'),('inactive');
grant select on media_test_users to authenticated;
insert into auth.users(id,email,raw_user_meta_data)
select id,label||id||'@example.invalid','{}'::jsonb from media_test_users;
update public.profiles p set role=case when u.label='inactive' then 'staff'::public.app_role else u.label::public.app_role end,
status=case when u.label='inactive' then 'inactive'::public.profile_status else 'active'::public.profile_status end
from media_test_users u where p.id=u.id;
create temporary table media_test_ids(kind text,id uuid);
grant all on media_test_ids to authenticated;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',(select id from media_test_users where label='staff'),'role','authenticated')::text,true);
insert into media_test_ids select 'development',(public.create_land_development('Audit','audit-development','residential','Test')).id;
insert into media_test_ids select 'unit',(public.create_land_unit((select id from media_test_ids where kind='development'),'1','audit-unit','residential',100,'sqm')).id;
-- These RPCs must succeed despite revoked activity_logs INSERT permission.
select public.update_land_development((select id from media_test_ids where kind='development'),'Audit changed','audit-development','residential','Test');
select public.update_land_unit((select id from media_test_ids where kind='unit'),'1','audit-unit','residential',100,'sqm');
insert into public.land_media(id,land_unit_id,media_type,storage_bucket,storage_path,original_filename,mime_type,file_size,created_by,updated_by)
select ('00000000-0000-0000-0000-00000000000'||n)::uuid,(select id from media_test_ids where kind='unit'),'photo','land-media','audit-'||n,'a.jpg','image/jpeg',100,auth.uid(),auth.uid() from generate_series(1,3) n;
insert into storage.objects(bucket_id,name,owner) values('land-documents','audit-private.pdf',auth.uid());
select public.set_land_media_cover('00000000-0000-0000-0000-000000000001');
select public.set_land_media_cover('00000000-0000-0000-0000-000000000002');
select public.move_land_media('00000000-0000-0000-0000-000000000002',-1);
do $$ begin
  if (select count(*) from public.land_media where is_cover)<>1 then raise exception 'Cover not unique'; end if;
  if (select id from public.land_media order by sort_order,created_at,id limit 1)<>'00000000-0000-0000-0000-000000000002'::uuid then raise exception 'Tie reorder failed'; end if;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.activity_logs where action like 'land.%')<8 then raise exception 'Land audit events missing'; end if;
  if exists(select 1 from storage.buckets where id in ('land-media','land-documents') and public) then raise exception 'Public private bucket'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',(select id from media_test_users where label='viewer'),'role','authenticated')::text,true);
do $$ begin
  if (select count(*) from storage.objects where name='audit-private.pdf')<>1 then raise exception 'Viewer signed-access source missing'; end if;
  if (select count(*) from public.land_media)<>3 then raise exception 'Viewer cannot read media'; end if;
  begin perform public.set_land_media_cover('00000000-0000-0000-0000-000000000001'); raise exception 'Viewer wrote cover'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',(select id from media_test_users where label='accountant'),'role','authenticated')::text,true);
do $$ begin
  begin perform public.move_land_media('00000000-0000-0000-0000-000000000001',1); raise exception 'Accountant reordered'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',(select id from media_test_users where label='inactive'),'role','authenticated')::text,true);
do $$ begin
  if exists(select 1 from storage.objects where name='audit-private.pdf') then raise exception 'Inactive read private object'; end if;
  if exists(select 1 from public.land_media) then raise exception 'Inactive user read media'; end if;
  begin perform public.set_land_media_cover('00000000-0000-0000-0000-000000000001'); raise exception 'Inactive wrote cover'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  if exists(select 1 from storage.objects where name='audit-private.pdf') then raise exception 'Anonymous read private object'; end if;
  begin perform 1 from public.land_media; raise exception 'Anonymous read media'; exception when insufficient_privilege then null; end;
end $$;
rollback;
