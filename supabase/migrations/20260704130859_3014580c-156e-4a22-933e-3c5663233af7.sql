
REVOKE EXECUTE ON FUNCTION public.is_district_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_center_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
