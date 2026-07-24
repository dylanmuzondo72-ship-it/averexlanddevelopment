do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'app_private.admin_update_profile(uuid,text,text,public.app_role,public.profile_status)'::regprocedure
  )
  into function_definition;

  if position('pg_advisory_xact_lock' in function_definition) = 0 then
    raise exception 'Administrator changes are missing transaction locking';
  end if;
  if position('remaining_admins = 0' in function_definition) = 0 then
    raise exception 'Final active administrator protection is missing';
  end if;
  if position('You cannot deactivate your current account' in function_definition) = 0 then
    raise exception 'Administrator self-deactivation protection is missing';
  end if;
end;
$$;

select 'Phase 3 final-administrator definition test passed' as result;
