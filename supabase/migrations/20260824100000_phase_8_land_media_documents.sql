create type public.land_media_type as enum ('photo','site_plan','map','brochure','survey_document','title_document','other_document');
create type public.land_media_visibility as enum ('internal','public_candidate');
create type public.land_media_approval as enum ('pending','approved','rejected');
create table public.land_media (
  id uuid primary key default gen_random_uuid(), development_id uuid references public.land_developments(id), land_unit_id uuid references public.land_units(id),
  media_type public.land_media_type not null, storage_bucket text not null check (storage_bucket in ('land-media','land-documents')), storage_path text not null unique,
  original_filename text not null, mime_type text not null, file_size bigint not null, caption text, alt_text text, sort_order integer not null default 0,
  is_cover boolean not null default false, visibility public.land_media_visibility not null default 'internal', approval_status public.land_media_approval not null default 'pending',
  crop_data jsonb not null default '{}'::jsonb, rotation integer not null default 0, created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint land_media_single_parent check ((development_id is not null) <> (land_unit_id is not null)), constraint land_media_file_size check (file_size > 0 and file_size <= 15728640),
  constraint land_media_bucket_type check ((storage_bucket='land-media' and mime_type in ('image/jpeg','image/png','image/webp')) or (storage_bucket='land-documents' and mime_type='application/pdf'))
);
create unique index land_media_development_cover_idx on public.land_media(development_id) where development_id is not null and is_cover and archived_at is null;
create unique index land_media_unit_cover_idx on public.land_media(land_unit_id) where land_unit_id is not null and is_cover and archived_at is null;
create index land_media_development_idx on public.land_media(development_id,sort_order) where archived_at is null;
create index land_media_unit_idx on public.land_media(land_unit_id,sort_order) where archived_at is null;
create index land_media_created_idx on public.land_media(created_at desc);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('land-media','land-media',false,10485760,array['image/jpeg','image/png','image/webp']),('land-documents','land-documents',false,15728640,array['application/pdf']) on conflict (id) do update set public=false;
alter table public.land_media enable row level security;
grant select,insert,update on public.land_media to authenticated;
create policy land_media_read on public.land_media for select to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff','accountant','viewer')));
create policy land_media_write on public.land_media for all to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff'))) with check (exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff')));
create policy land_media_storage_read on storage.objects for select to authenticated using (bucket_id in ('land-media','land-documents') and exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff','accountant','viewer')));
create policy land_media_storage_write on storage.objects for all to authenticated using (bucket_id in ('land-media','land-documents') and exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff'))) with check (bucket_id in ('land-media','land-documents') and exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('administrator','staff')));
