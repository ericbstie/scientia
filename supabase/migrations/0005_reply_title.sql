-- Reply notifications read "New reply: <thread>" (US-16).
create or replace function app_private.on_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t public.threads;
begin
  select * into t from public.threads where id = new.thread_id;
  perform app_private.notify(array[t.author_id], t.course_id, 'reply',
    'New reply: ' || t.title, '/courses/' || t.course_id || '/discussions/' || t.id);
  return new;
end $$;
