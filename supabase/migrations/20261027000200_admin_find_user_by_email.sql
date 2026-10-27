-- AdminStore "gift item" looked users up via profiles.email, which does not exist.
-- Emails live in auth.users only; expose a lookup to admins without leaking emails to other roles.

CREATE OR REPLACE FUNCTION public.admin_find_user_by_email(p_email text)
RETURNS TABLE (user_id uuid, full_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Không có quyền tra cứu tài khoản';
  END IF;

  RETURN QUERY
  SELECT u.id, p.full_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE lower(u.email) = lower(trim(p_email))
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_find_user_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_find_user_by_email(text) TO authenticated;
