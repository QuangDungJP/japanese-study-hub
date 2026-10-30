-- Free tier: stop realtime on tables no UI subscribes to (re-add with: alter publication supabase_realtime add table public.<t>;)
alter publication supabase_realtime drop table public.attendance, public.class_assignment_submissions, public.teacher_timesheets;
