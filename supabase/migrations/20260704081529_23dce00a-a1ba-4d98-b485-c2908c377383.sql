
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_district_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_center_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_district_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_center_id() TO authenticated;
