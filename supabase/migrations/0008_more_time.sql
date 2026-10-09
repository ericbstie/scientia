-- Gap 4: a teacher gives one student more time on one assignment (US-45).
-- The later of the student's own date and the assignment's date applies, so moving
-- the assignment's date later never leaves that student with less time than others.
create table public.extensions (
  assignment_id uuid not null references public.assignments on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);
alter table public.extensions enable row level security;
create policy extensions_read on public.extensions for select to authenticated
  using (student_id = auth.uid() or public.is_teacher(public.assignment_course(assignment_id)));
create policy extensions_write on public.extensions for all to authenticated
  using (public.is_teacher(public.assignment_course(assignment_id)))
  with check (public.is_teacher(public.assignment_course(assignment_id)) and public.is_student_in(assignment_id, student_id));
grant select, insert, update, delete on public.extensions to authenticated;

-- The due date that applies to student s (as the caller sees extensions under RLS).
create function public.due_for(a public.assignments, s uuid) returns timestamptz
language sql stable set search_path = '' as $$
  select greatest(a.due_at, (select e.due_at from public.extensions e where e.assignment_id = a.id and e.student_id = s))
$$;
-- The due date that applies to the signed-in user; the app selects it as `due_at:my_due_at`.
create function public.my_due_at(a public.assignments) returns timestamptz
language sql stable set search_path = '' as $$
  select public.due_for(a, auth.uid())
$$;
revoke execute on function public.due_for(public.assignments, uuid), public.my_due_at(public.assignments) from public;
grant execute on function public.due_for(public.assignments, uuid), public.my_due_at(public.assignments) to authenticated;

create or replace function public.can_submit(a uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assignments x
    where x.id = a and x.published
      and public.course_role_of(x.course_id) = 'student'
      and (x.allow_late or now() <= public.due_for(x, auth.uid()))
  )
$$;

create or replace function app_private.guard_submission() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.assignments; due timestamptz;
begin
  select * into a from public.assignments where id = new.assignment_id;
  due := public.due_for(a, new.student_id);
  if not a.allow_late and now() > due then
    raise exception 'This assignment is closed: it stopped accepting work on %', to_char(due at time zone 'UTC', 'Dy DD Mon, HH24:MI')
      using errcode = 'P0001';
  end if;
  if exists (select 1 from public.grades g where g.assignment_id = new.assignment_id and g.student_id = new.student_id) then
    raise exception 'Your teacher has started grading this work, so it can no longer be changed.' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- The student hears about their new date like any other due date change.
create function app_private.on_extension() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.assignments;
begin
  select * into a from public.assignments where id = new.assignment_id;
  if a.published then
    perform app_private.notify(array[new.student_id], a.course_id, 'due_changed',
      'Due date changed: ' || a.title, '/courses/' || a.course_id || '/assignments/' || a.id);
  end if;
  return new;
end $$;
create trigger notify_extension after insert or update of due_at on public.extensions
  for each row execute function app_private.on_extension();
