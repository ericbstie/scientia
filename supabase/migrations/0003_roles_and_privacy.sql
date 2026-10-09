-- Global account role (shown to admins) and email privacy.
-- See docs/decisions/0006-account-roles-and-email-privacy.md.

alter table public.profiles add column role text not null default 'student' check (role in ('student', 'teacher', 'admin'));
update public.profiles set role = 'admin' where is_admin;
alter table public.profiles drop column is_admin;
alter table public.profiles add column is_admin boolean generated always as (role = 'admin') stored;

-- Emails are private: other users' emails are only available through the functions below.
revoke select on public.profiles from authenticated, anon;
grant select (id, full_name, role, is_admin, deactivated, created_at) on public.profiles to authenticated;

create function app_private.handle_new_user_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set role = coalesce(new.raw_user_meta_data ->> 'role', 'student') where id = new.id
    and coalesce(new.raw_user_meta_data ->> 'role', 'student') in ('student', 'teacher', 'admin');
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
  for each row execute function app_private.handle_new_user_role();

/** Roster of a course. Emails are included for the course's teachers (and admins) only. */
create function public.course_people(c uuid)
returns table (user_id uuid, full_name text, email text, role public.course_role)
language sql stable security definer set search_path = '' as $$
  select p.id, p.full_name, case when public.is_teacher(c) then p.email end, e.role
  from public.enrollments e join public.profiles p on p.id = e.user_id
  where e.course_id = c and public.is_member(c)
$$;

/** Teacher adds an existing student account to a course by email (case-insensitive). */
create function public.enrol_by_email(c uuid, address text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  if not public.is_teacher(c) then
    raise exception 'Only teachers of this course can add people.' using errcode = 'P0001';
  end if;
  select * into p from public.profiles where lower(email) = lower(trim(address));
  if p.id is null then
    raise exception 'No Scientia account uses this email. Ask an administrator to create one.' using errcode = 'P0001';
  end if;
  if p.role <> 'student' then
    raise exception 'Only student accounts can be added to a course.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.enrollments where course_id = c and user_id = p.id) then
    raise exception '% is already in this course.', p.full_name using errcode = 'P0001';
  end if;
  insert into public.enrollments (course_id, user_id, role) values (c, p.id, 'student');
  return p.id;
end $$;

/** Admin directory with emails. */
create function public.admin_users()
returns table (id uuid, full_name text, email text, role text, deactivated boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can list accounts.' using errcode = 'P0001';
  end if;
  return query select p.id, p.full_name, p.email, p.role, p.deactivated, p.created_at from public.profiles p order by p.full_name;
end $$;

revoke execute on function public.course_people(uuid), public.enrol_by_email(uuid, text), public.admin_users() from anon;
