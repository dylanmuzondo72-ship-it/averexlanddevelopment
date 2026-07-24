begin;

create temporary table phase3_test_users(label text primary key, id uuid not null)
on commit drop;
grant all on phase3_test_users to authenticated;

insert into phase3_test_users(label, id)
values
  ('administrator', gen_random_uuid()),
  ('staff', gen_random_uuid()),
  ('accountant', gen_random_uuid()),
  ('viewer', gen_random_uuid()),
  ('inactive', gen_random_uuid());

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  test.id,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'phase3-' || test.label || '-' || test.id || '@example.invalid',
  '',
  now(),
  '{}'::jsonb,
  jsonb_build_object('full_name', 'Phase 3 ' || initcap(test.label)),
  now(),
  now()
from phase3_test_users test;

update public.profiles p
set role = case test.label
      when 'administrator' then 'administrator'::public.app_role
      when 'staff' then 'staff'::public.app_role
      when 'accountant' then 'accountant'::public.app_role
      else 'viewer'::public.app_role
    end,
    status = case
      when test.label = 'inactive' then 'inactive'::public.profile_status
      else 'active'::public.profile_status
    end
from phase3_test_users test
where p.id = test.id;

create temporary table phase3_test_clients(
  label text primary key, id uuid not null, client_reference text not null
) on commit drop;
grant all on phase3_test_clients to authenticated;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase3_test_users where label = 'administrator'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
declare
  created_client public.clients;
  second_client public.clients;
begin
  created_client := public.create_client(
    'individual',
    'Phase 3 Transaction Test',
    null,
    null,
    'phase3-client@example.invalid',
    '+263 700 000 001'
  );
  second_client := public.create_client(
    'company',
    'Phase 3 Company Test',
    'Phase 3 Company Test',
    'Test Contact',
    'phase3-company@example.invalid',
    '+263 700 000 002'
  );

  if created_client.client_reference !~ '^[A-Z0-9-]+-[0-9]{6}$' then
    raise exception 'Client reference format is invalid';
  end if;
  if created_client.client_reference = second_client.client_reference then
    raise exception 'Client references are not unique';
  end if;

  insert into phase3_test_clients(label, id, client_reference)
  values
    ('individual', created_client.id, created_client.client_reference),
    ('company', second_client.id, second_client.client_reference);
end;
$$;

do $$
declare
  target_id uuid := (
    select id from phase3_test_clients where label = 'individual'
  );
  changed_client public.clients;
begin
  changed_client := public.update_client(
    target_id,
    'individual',
    'Phase 3 Transaction Test Updated',
    null,
    null,
    'phase3-client@example.invalid',
    '+263 700 000 001'
  );
  if changed_client.display_name <> 'Phase 3 Transaction Test Updated' then
    raise exception 'Client update failed';
  end if;

  changed_client := public.set_client_archived(target_id, true);
  if changed_client.status <> 'archived' or changed_client.archived_at is null then
    raise exception 'Client archive failed';
  end if;

  changed_client := public.set_client_archived(target_id, false);
  if changed_client.status <> 'active' or changed_client.archived_at is not null then
    raise exception 'Client restore failed';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from public.activity_logs logs
    where logs.resource_type = 'client'
      and logs.resource_id = (
        select id from phase3_test_clients where label = 'individual'
      )
      and logs.action in (
        'client.created',
        'client.updated',
        'client.archived',
        'client.restored'
      )
  ) then
    raise exception 'Client activity logging failed';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase3_test_users where label = 'staff'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
declare
  staff_client public.clients;
begin
  staff_client := public.create_client(
    'individual',
    'Phase 3 Staff Test',
    null,
    null,
    null,
    '+263 700 000 003',
    null,
    null,
    null,
    null,
    null,
    (select id from phase3_test_users where label = 'administrator')
  );

  if staff_client.assigned_to <> (
    select id from phase3_test_users where label = 'staff'
  ) then
    raise exception 'Staff-created client assignment was not enforced';
  end if;

  begin
    perform public.set_client_archived(staff_client.id, true);
    raise exception 'Staff archive unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.clients (
      client_reference,
      client_type,
      display_name,
      phone,
      created_by,
      updated_by
    )
    values (
      'BROWSER-SUPPLIED',
      'individual',
      'Direct Insert Test',
      '+263 700 000 004',
      (select id from phase3_test_users where label = 'staff'),
      (select id from phase3_test_users where label = 'staff')
    );
    raise exception 'Direct authenticated insert unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase3_test_users where label = 'accountant'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  if (select count(*) from public.clients) < 2 then
    raise exception 'Accountant client read policy failed';
  end if;
  if (select count(*) from public.company_settings) <> 1 then
    raise exception 'Accountant settings read policy failed';
  end if;

  begin
    perform public.create_client(
      'individual',
      'Accountant Write Test',
      null,
      null,
      null,
      '+263 700 000 005'
    );
    raise exception 'Accountant client creation unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase3_test_users where label = 'viewer'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  if (select count(*) from public.clients) < 2 then
    raise exception 'Viewer client read policy failed';
  end if;
  if (select count(*) from public.company_settings) <> 0 then
    raise exception 'Viewer settings restriction failed';
  end if;
  if (select count(*) from public.activity_logs) <> 0 then
    raise exception 'Viewer general activity restriction failed';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase3_test_users where label = 'inactive'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  if (select count(*) from public.clients) <> 0 then
    raise exception 'Inactive profile client blocking failed';
  end if;

  begin
    perform public.create_client(
      'individual',
      'Inactive Write Test',
      null,
      null,
      null,
      '+263 700 000 006'
    );
    raise exception 'Inactive profile write unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase3_test_users where label = 'administrator'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  begin
    perform public.admin_update_profile(
      (select id from phase3_test_users where label = 'administrator'),
      'Phase 3 Administrator',
      '',
      'administrator',
      'inactive'
    );
    raise exception 'Administrator self-deactivation unexpectedly succeeded';
  exception
    when check_violation then null;
  end;
end;
$$;

rollback;

select 'Phase 3 database security tests passed' as result;
