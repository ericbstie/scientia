-- Core LMS schema. See docs/decisions/0005-data-model-and-rls.md.

create type public.course_role as enum ('teacher', 'student');
create type public.material_kind as enum ('page', 'file', 'link');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  term text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.course_role not null default 'student',
  created_at timestamptz not null default now(),
  primary key (course_id, user_id)
);
create index on public.enrollments (user_id);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.modules (course_id, position);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  kind public.material_kind not null,
  title text not null,
  body text not null default '',
  url text,
  file_path text,
  file_name text,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.materials (module_id, position);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  title text not null,
  body text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.announcements (course_id, created_at desc);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  title text not null,
  description text not null default '',
  due_at timestamptz not null,
  points numeric(6, 2) not null default 100 check (points >= 0),
  accepts_text boolean not null default true,
  accepts_files boolean not null default true,
  allow_late boolean not null default true,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.assignments (course_id, due_at);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null default '',
  files jsonb not null default '[]'::jsonb, -- [{ "path": "...", "name": "...", "size": 123 }]
  attempt int not null default 1,
  submitted_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table public.grades (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  score numeric(6, 2) check (score >= 0),
  feedback text not null default '',
  released boolean not null default false,
  graded_by uuid references public.profiles (id) default auth.uid(),
  graded_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);
create index on public.threads (course_id, created_at desc);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.replies (thread_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete cascade,
  kind text not null, -- announcement | assignment | grade | reply
  title text not null,
  link text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

-- Notification preferences: a row with enabled = false switches a kind off.
-- Kinds: announcement | assignment | due_changed | grade | reply
create table public.notification_prefs (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('announcement', 'assignment', 'due_changed', 'grade', 'reply')),
  enabled boolean not null default true,
  primary key (user_id, kind)
);

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer so policies don't recurse through RLS)

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create function public.course_role_of(c uuid) returns public.course_role
language sql stable security definer set search_path = '' as $$
  select role from public.enrollments where course_id = c and user_id = auth.uid()
$$;

create function public.is_member(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.course_role_of(c) is not null or public.is_admin()
$$;

create function public.is_teacher(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.course_role_of(c) = 'teacher' or public.is_admin()
$$;

-- ---------------------------------------------------------------------------
-- Row-level security

alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.modules enable row level security;
alter table public.materials enable row level security;
alter table public.announcements enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;
alter table public.threads enable row level security;
alter table public.replies enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_prefs enable row level security;

create policy courses_read on public.courses for select to authenticated using (public.is_member(id));
create policy courses_admin on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy courses_teacher_update on public.courses for update to authenticated using (public.is_teacher(id)) with check (public.is_teacher(id));

create policy enrollments_read on public.enrollments for select to authenticated using (public.is_member(course_id));
create policy enrollments_write on public.enrollments for insert to authenticated with check (public.is_teacher(course_id));
create policy enrollments_update on public.enrollments for update to authenticated using (public.is_teacher(course_id)) with check (public.is_teacher(course_id));
create policy enrollments_delete on public.enrollments for delete to authenticated using (public.is_teacher(course_id) and user_id <> auth.uid());

create policy modules_read on public.modules for select to authenticated
  using (public.is_member(course_id) and (published or public.is_teacher(course_id)));
create policy modules_write on public.modules for all to authenticated
  using (public.is_teacher(course_id)) with check (public.is_teacher(course_id));

create policy materials_read on public.materials for select to authenticated
  using (public.is_member(course_id) and (published or public.is_teacher(course_id)));
create policy materials_write on public.materials for all to authenticated
  using (public.is_teacher(course_id)) with check (public.is_teacher(course_id));

create policy announcements_read on public.announcements for select to authenticated using (public.is_member(course_id));
create policy announcements_write on public.announcements for all to authenticated
  using (public.is_teacher(course_id)) with check (public.is_teacher(course_id));

create policy assignments_read on public.assignments for select to authenticated
  using (public.is_member(course_id) and (published or public.is_teacher(course_id)));
create policy assignments_write on public.assignments for all to authenticated
  using (public.is_teacher(course_id)) with check (public.is_teacher(course_id));

create function public.can_submit(a uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assignments x
    where x.id = a and x.published
      and public.course_role_of(x.course_id) = 'student'
      and (x.allow_late or now() <= x.due_at)
  )
$$;

create function public.assignment_course(a uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select course_id from public.assignments where id = a
$$;

create policy submissions_read on public.submissions for select to authenticated
  using (student_id = auth.uid() or public.is_teacher(public.assignment_course(assignment_id)));
create policy submissions_insert on public.submissions for insert to authenticated
  with check (student_id = auth.uid() and public.can_submit(assignment_id));
create policy submissions_update on public.submissions for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid() and public.can_submit(assignment_id));

create policy grades_read on public.grades for select to authenticated
  using ((student_id = auth.uid() and released) or public.is_teacher(public.assignment_course(assignment_id)));
create policy grades_write on public.grades for all to authenticated
  using (public.is_teacher(public.assignment_course(assignment_id)))
  with check (public.is_teacher(public.assignment_course(assignment_id)));

create policy threads_read on public.threads for select to authenticated using (public.is_member(course_id));
create policy threads_insert on public.threads for insert to authenticated
  with check (author_id = auth.uid() and public.is_member(course_id));
create policy threads_modify on public.threads for update to authenticated
  using (author_id = auth.uid() or public.is_teacher(course_id));
create policy threads_delete on public.threads for delete to authenticated
  using (author_id = auth.uid() or public.is_teacher(course_id));

create function public.thread_course(t uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select course_id from public.threads where id = t
$$;

create policy replies_read on public.replies for select to authenticated using (public.is_member(public.thread_course(thread_id)));
create policy replies_insert on public.replies for insert to authenticated
  with check (author_id = auth.uid() and public.is_member(public.thread_course(thread_id)));
create policy replies_delete on public.replies for delete to authenticated
  using (author_id = auth.uid() or public.is_teacher(public.thread_course(thread_id)));

create policy notifications_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_mark on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy prefs_own on public.notification_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on type public.course_role, public.material_kind to authenticated;
-- Profiles: only the display name is editable, and only through the policy above.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications (in-app only, calm by default: one per meaningful event)

create function app_private.notify(recipients uuid[], c uuid, k text, t text, l text) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, course_id, kind, title, link)
  select r, c, k, t, l from unnest(recipients) r
  where r is distinct from auth.uid()
    and not exists (select 1 from public.notification_prefs p where p.user_id = r and p.kind = k and not p.enabled)
$$;

create function app_private.students_of(c uuid) returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(user_id), '{}') from public.enrollments where course_id = c and role = 'student'
$$;

create function app_private.on_announcement() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.notify(app_private.students_of(new.course_id), new.course_id, 'announcement',
    'New announcement: ' || new.title, '/courses/' || new.course_id || '/announcements#' || new.id);
  return new;
end $$;
create trigger notify_announcement after insert on public.announcements
  for each row execute function app_private.on_announcement();

create function app_private.on_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.published and (tg_op = 'INSERT' or not old.published) then
    perform app_private.notify(app_private.students_of(new.course_id), new.course_id, 'assignment',
      'New assignment: ' || new.title, '/courses/' || new.course_id || '/assignments/' || new.id);
  elsif tg_op = 'UPDATE' and new.published and old.published and new.due_at <> old.due_at then
    perform app_private.notify(app_private.students_of(new.course_id), new.course_id, 'due_changed',
      'Due date changed: ' || new.title, '/courses/' || new.course_id || '/assignments/' || new.id);
  end if;
  return new;
end $$;
create trigger notify_assignment after insert or update of published, due_at on public.assignments
  for each row execute function app_private.on_assignment();

create function app_private.on_grade() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.assignments;
begin
  if new.released and (tg_op = 'INSERT' or not old.released) then
    select * into a from public.assignments where id = new.assignment_id;
    perform app_private.notify(array[new.student_id], a.course_id, 'grade',
      'Grade released: ' || a.title, '/courses/' || a.course_id || '/assignments/' || a.id);
  end if;
  return new;
end $$;
create trigger notify_grade after insert or update of released on public.grades
  for each row execute function app_private.on_grade();

create function app_private.on_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t public.threads;
begin
  select * into t from public.threads where id = new.thread_id;
  perform app_private.notify(array[t.author_id], t.course_id, 'reply',
    'Reply: ' || t.title, '/courses/' || t.course_id || '/discussions/' || t.id);
  return new;
end $$;
create trigger notify_reply after insert on public.replies
  for each row execute function app_private.on_reply();

-- Clear errors instead of a generic RLS failure (BEFORE triggers run before RLS checks).
create function app_private.guard_submission() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.assignments;
begin
  select * into a from public.assignments where id = new.assignment_id;
  if not a.allow_late and now() > a.due_at then
    raise exception 'This assignment is closed: it stopped accepting work on %', to_char(a.due_at at time zone 'UTC', 'Dy DD Mon, HH24:MI')
      using errcode = 'P0001';
  end if;
  if exists (select 1 from public.grades g where g.assignment_id = new.assignment_id and g.student_id = new.student_id) then
    raise exception 'Your teacher has started grading this work, so it can no longer be changed.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger guard_submission before insert or update on public.submissions
  for each row execute function app_private.guard_submission();

-- Resubmission bumps the attempt counter and timestamp.
create function app_private.on_resubmit() returns trigger
language plpgsql as $$
begin
  new.attempt := old.attempt + 1;
  new.submitted_at := now();
  new.student_id := old.student_id;
  new.assignment_id := old.assignment_id;
  return new;
end $$;
create trigger resubmit before update on public.submissions
  for each row execute function app_private.on_resubmit();

-- ---------------------------------------------------------------------------
-- Storage: two private buckets with path-based policies.
--   materials/<course_id>/<file>
--   submissions/<assignment_id>/<student_id>/<file>

insert into storage.buckets (id, name, public) values ('materials', 'materials', false), ('submissions', 'submissions', false)
  on conflict (id) do nothing;

create function public.safe_uuid(t text) returns uuid
language plpgsql immutable as $$
begin
  return t::uuid;
exception when others then
  return null;
end $$;

create policy materials_read on storage.objects for select to authenticated
  using (bucket_id = 'materials' and public.is_member(public.safe_uuid((storage.foldername(name))[1])));
create policy materials_write on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and public.is_teacher(public.safe_uuid((storage.foldername(name))[1])));
create policy materials_delete on storage.objects for delete to authenticated
  using (bucket_id = 'materials' and public.is_teacher(public.safe_uuid((storage.foldername(name))[1])));

create policy submissions_read on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and (
    (storage.foldername(name))[2] = auth.uid()::text
    or public.is_teacher(public.assignment_course(public.safe_uuid((storage.foldername(name))[1])))
  ));
create policy submissions_write on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text
    and public.can_submit(public.safe_uuid((storage.foldername(name))[1])));
