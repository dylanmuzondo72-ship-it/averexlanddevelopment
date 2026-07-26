update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png']::text[]
where id = 'payment-proofs';

drop policy if exists payment_proofs_insert_authorised on storage.objects;
drop policy if exists payment_proofs_select_authorised on storage.objects;
drop policy if exists payment_proofs_update_authorised on storage.objects;
drop policy if exists payment_proofs_delete_authorised on storage.objects;

create policy payment_proofs_insert_authorised on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active' and p.role in ('administrator','accountant'))
  and name ~ '^[0-9a-fA-F-]{36}/[A-Za-z0-9._-]+$'
);

create policy payment_proofs_select_authorised on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active' and p.role in ('administrator','accountant'))
);

create policy payment_proofs_update_authorised on storage.objects
for update to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active' and p.role in ('administrator','accountant'))
)
with check (bucket_id = 'payment-proofs');

create policy payment_proofs_delete_authorised on storage.objects
for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active' and p.role in ('administrator','accountant'))
);
