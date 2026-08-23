do $$ begin
  if to_regclass('public.land_developments') is null or to_regclass('public.land_units') is null then raise exception 'Phase 7 land tables missing'; end if;
  if not (select relrowsecurity from pg_class where oid='public.land_developments'::regclass) then raise exception 'RLS missing on land_developments'; end if;
  if not (select relrowsecurity from pg_class where oid='public.land_units'::regclass) then raise exception 'RLS missing on land_units'; end if;
  if (select count(*) from public.land_developments) <> 0 or (select count(*) from public.land_units) <> 0 then raise exception 'Phase 7 test expects no production land records'; end if;
  raise notice 'Phase 7 land foundation database tests passed';
end $$;
