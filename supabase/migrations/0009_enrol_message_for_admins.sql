-- #25: an admin adding a student can create the missing account themselves, so they
-- are pointed at the Users page instead of being told to ask an administrator.
create or replace function public.enrol_by_email(c uuid, address text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  if not public.is_teacher(c) then
    raise exception 'Only teachers of this course can add people.' using errcode = 'P0001';
  end if;
  select * into p from public.profiles where lower(email) = lower(trim(address));
  if p.id is null or p.deactivated then
    if public.is_admin() then
      raise exception 'No Scientia account uses this email. Create it on the Users page first.' using errcode = 'P0001';
    end if;
    raise exception 'No Scientia account uses this email. Ask an administrator to create one.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.enrollments where course_id = c and user_id = p.id) then
    raise exception '% is already in this course.', p.full_name using errcode = 'P0001';
  end if;
  if p.role <> 'student' then
    raise exception 'Only student accounts can be added to a course.' using errcode = 'P0001';
  end if;
  insert into public.enrollments (course_id, user_id, role) values (c, p.id, 'student');
  return p.id;
end $$;
