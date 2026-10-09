-- Lets a student know grading has started on their work without revealing the grade (US-10).
create function public.grading_started(a uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.grades g where g.assignment_id = a and g.student_id = auth.uid())
$$;
revoke execute on function public.grading_started(uuid) from anon;
