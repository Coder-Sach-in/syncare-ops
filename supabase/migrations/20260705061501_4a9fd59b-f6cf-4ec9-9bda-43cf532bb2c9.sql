
-- Harden user_roles: only service_role can write; authenticated may only read own row.

-- 1) Revoke any client write privileges (defense in depth beyond RLS)
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

-- Ensure required grants exist for the current setup
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 2) Add explicit RESTRICTIVE policies so no future permissive policy could ever
--    unlock client-side writes to user_roles.
DROP POLICY IF EXISTS "Block client inserts on user_roles" ON public.user_roles;
CREATE POLICY "Block client inserts on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

DROP POLICY IF EXISTS "Block client updates on user_roles" ON public.user_roles;
CREATE POLICY "Block client updates on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Block client deletes on user_roles" ON public.user_roles;
CREATE POLICY "Block client deletes on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (false);
