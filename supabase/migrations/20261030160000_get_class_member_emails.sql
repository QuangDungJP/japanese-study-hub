-- Teacher notification follow-up emails: profiles has no email column; emails live in auth.users.
-- Return emails only for users the caller may see as a class teacher (owner/co-teacher) or as admin.
CREATE OR REPLACE FUNCTION public.get_class_member_emails(_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text, full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT u.id, u.email::text, p.full_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = ANY(_user_ids)
    AND auth.uid() IS NOT NULL
    AND (public.has_role(auth.uid(), 'admin') OR public.can_teacher_view_profile(u.id, auth.uid()));
$$;
REVOKE EXECUTE ON FUNCTION public.get_class_member_emails(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_class_member_emails(uuid[]) TO authenticated;
