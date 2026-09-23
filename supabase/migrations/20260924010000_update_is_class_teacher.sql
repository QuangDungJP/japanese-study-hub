CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = _class_id AND teacher_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.class_teachers
    WHERE class_id = _class_id AND teacher_id = _user_id
  );
$$;
