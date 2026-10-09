-- Announcement read state, edit marker, and teacher-removed discussion posts.

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);
alter table public.announcement_reads enable row level security;
create policy announcement_reads_own on public.announcement_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on public.announcement_reads to authenticated;

alter table public.announcements add column edited_at timestamptz;

-- Teachers remove posts by flagging them; the thread keeps a "Removed by the teacher" placeholder.
alter table public.replies add column removed boolean not null default false;
alter table public.threads add column removed boolean not null default false;
create policy replies_moderate on public.replies for update to authenticated
  using (public.is_teacher(public.thread_course(thread_id)) or author_id = auth.uid())
  with check (public.is_teacher(public.thread_course(thread_id)) or author_id = auth.uid());
