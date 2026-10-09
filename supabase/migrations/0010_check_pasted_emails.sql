-- #31: a pasted list of emails is checked as a whole before anyone is added, with the
-- same messages as adding one address, so every problem can be shown at once.
create function app_private.enrol_problem(c uuid, address text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into p from public.profiles where lower(email) = lower(trim(address));
  if p.id is null or p.deactivated then
    return case when public.is_admin()
      then 'No Scientia account uses this email. Create it on the Users page first.'
      else 'No Scientia account uses this email. Ask an administrator to create one.' end;
  end if;
  if exists (select 1 from public.enrollments where course_id = c and user_id = p.id) then
    return p.full_name || ' is already in this course.';
  end if;
  if p.role <> 'student' then
    return 'Only student accounts can be added to a course.';
  end if;
  return null;
end $$;
revoke execute on function app_private.enrol_problem(uuid, text) from public;

create or replace function public.enrol_by_email(c uuid, address text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare problem text; uid uuid;
begin
  if not public.is_teacher(c) then
    raise exception 'Only teachers of this course can add people.' using errcode = 'P0001';
  end if;
  problem := app_private.enrol_problem(c, address);
  if problem is not null then
    raise exception '%', problem using errcode = 'P0001';
  end if;
  select p.id into uid from public.profiles p where lower(p.email) = lower(trim(address));
  insert into public.enrollments (course_id, user_id, role) values (c, uid, 'student');
  return uid;
end $$;

-- One row per address, with what stops it being added (null when it can be).
create function public.enrol_check(c uuid, addresses text[]) returns table (address text, problem text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_teacher(c) then
    raise exception 'Only teachers of this course can add people.' using errcode = 'P0001';
  end if;
  return query select a, app_private.enrol_problem(c, a) from unnest(addresses) as a;
end $$;
revoke execute on function public.enrol_check(uuid, text[]) from public;
grant execute on function public.enrol_check(uuid, text[]) to authenticated;
