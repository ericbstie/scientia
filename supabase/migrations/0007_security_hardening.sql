-- Fixes from docs/process/reviews/m3-security.md (B1, B4, B5, B7, B8, S1–S7, N1, N2).

-- B1: the account role is never taken from user-supplied signup metadata.
drop trigger on_auth_user_created_role on auth.users;
drop function app_private.handle_new_user_role();

-- B4: material in an unpublished module is hidden from students.
create function public.module_published(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select published from public.modules where id = m), false)
$$;
drop policy materials_read on public.materials;
create policy materials_read on public.materials for select to authenticated
  using (public.is_teacher(course_id) or (public.is_member(course_id) and published and public.module_published(module_id)));

-- B5: files are readable by students only while their material is visible.
create function public.material_file_visible(path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.materials m
    where m.file_path = path and m.published and public.module_published(m.module_id) and public.is_member(m.course_id)
  )
$$;
drop policy materials_read on storage.objects;
create policy materials_read on storage.objects for select to authenticated
  using (bucket_id = 'materials' and (
    public.is_teacher(public.safe_uuid((storage.foldername(name))[1])) or public.material_file_visible(name)
  ));

-- B7: links must be http(s).
alter table public.materials add constraint materials_url_scheme check (url is null or url ~* '^https?://');

-- B8 / S5: authors cannot undo moderation or move posts between courses/threads.
create function app_private.guard_post() returns trigger
language plpgsql security definer set search_path = '' as $$
declare c uuid;
begin
  if tg_table_name = 'threads' then
    c := old.course_id;
    if new.course_id <> old.course_id or new.author_id <> old.author_id then
      raise exception 'Posts cannot be moved or reassigned.' using errcode = 'P0001';
    end if;
  else
    c := public.thread_course(old.thread_id);
    if new.thread_id <> old.thread_id or new.author_id <> old.author_id then
      raise exception 'Posts cannot be moved or reassigned.' using errcode = 'P0001';
    end if;
  end if;
  if new.removed is distinct from old.removed and not public.is_teacher(c) then
    raise exception 'Only a teacher can remove or restore posts.' using errcode = 'P0001';
  end if;
  if old.removed and not public.is_teacher(c) then
    raise exception 'This post was removed by a teacher.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger guard_thread before update on public.threads for each row execute function app_private.guard_post();
create trigger guard_reply before update on public.replies for each row execute function app_private.guard_post();

-- S1: teachers enrol students only; only admins create teacher enrolments. Deactivated accounts can't be enrolled.
drop policy enrollments_write on public.enrollments;
create policy enrollments_write on public.enrollments for insert to authenticated
  with check (public.is_admin() or (public.is_teacher(course_id) and role = 'student'
    and exists (select 1 from public.profiles p where p.id = user_id and p.role = 'student' and not p.deactivated)));
drop policy enrollments_update on public.enrollments;
create policy enrollments_update on public.enrollments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- S2: grades only for students enrolled in the assignment's course.
create function public.is_student_in(a uuid, s uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e where e.course_id = public.assignment_course(a) and e.user_id = s and e.role = 'student')
$$;
drop policy grades_write on public.grades;
create policy grades_write on public.grades for all to authenticated
  using (public.is_teacher(public.assignment_course(assignment_id)))
  with check (public.is_teacher(public.assignment_course(assignment_id)) and public.is_student_in(assignment_id, student_id));

-- S3: announcements are always by the poster.
drop policy announcements_write on public.announcements;
create policy announcements_insert on public.announcements for insert to authenticated
  with check (public.is_teacher(course_id) and author_id = auth.uid());
create policy announcements_modify on public.announcements for update to authenticated
  using (public.is_teacher(course_id)) with check (public.is_teacher(course_id));
create policy announcements_delete on public.announcements for delete to authenticated
  using (public.is_teacher(course_id));

-- S4: the server clock decides submission time and attempt on first insert.
create function app_private.stamp_submission() returns trigger
language plpgsql as $$
begin
  new.submitted_at := now();
  new.attempt := 1;
  return new;
end $$;
create trigger stamp_submission before insert on public.submissions for each row execute function app_private.stamp_submission();

-- S6: the enrol error no longer reveals names for accounts outside the course.
create or replace function public.enrol_by_email(c uuid, address text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  if not public.is_teacher(c) then
    raise exception 'Only teachers of this course can add people.' using errcode = 'P0001';
  end if;
  select * into p from public.profiles where lower(email) = lower(trim(address));
  if p.id is null or p.deactivated then
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

-- S7: deactivated accounts lose access in the data layer too (tokens issued before deactivation).
create or replace function public.course_role_of(c uuid) returns public.course_role
language sql stable security definer set search_path = '' as $$
  select e.role from public.enrollments e join public.profiles p on p.id = e.user_id
  where e.course_id = c and e.user_id = auth.uid() and not p.deactivated
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin and not deactivated from public.profiles where id = auth.uid()), false)
$$;

-- N1: functions are executable by PUBLIC by default; restrict to signed-in users.
revoke execute on function public.course_people(uuid), public.enrol_by_email(uuid, text), public.admin_users(),
  public.grading_started(uuid) from public;
grant execute on function public.course_people(uuid), public.enrol_by_email(uuid, text), public.admin_users(),
  public.grading_started(uuid) to authenticated;

-- N2: users may only mark their notifications read.
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
