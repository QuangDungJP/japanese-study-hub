
CREATE TABLE public.class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  location text,
  meet_link text,
  topic text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_class_sessions_class ON public.class_sessions(class_id, session_date);

ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage class_sessions"
ON public.class_sessions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers manage own class_sessions"
ON public.class_sessions FOR ALL
USING (public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Students view sessions of enrolled classes"
ON public.class_sessions FOR SELECT
USING (public.is_class_student(class_id, auth.uid()));

CREATE TRIGGER trg_class_sessions_updated
BEFORE UPDATE ON public.class_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
