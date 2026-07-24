create index if not exists clients_created_by_idx
  on public.clients (created_by);

create index if not exists clients_updated_by_idx
  on public.clients (updated_by);
