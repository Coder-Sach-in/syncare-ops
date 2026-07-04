
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('district_admin', 'center_staff');
CREATE TYPE public.center_type AS ENUM ('PHC', 'CHC');

-- ============ CENTERS ============
CREATE TABLE public.centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_name text NOT NULL UNIQUE,
  center_type public.center_type NOT NULL,
  district text NOT NULL DEFAULT 'Ujjain',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.centers TO authenticated;
GRANT ALL ON public.centers TO service_role;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES (secure, separate table) ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  center_id uuid REFERENCES public.centers(id) ON DELETE SET NULL,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER HELPERS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_district_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'district_admin'); $$;

CREATE OR REPLACE FUNCTION public.current_center_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT center_id FROM public.profiles WHERE id = auth.uid(); $$;

-- Profile policies
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_district_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Centers policies
CREATE POLICY "Authenticated read centers" ON public.centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages centers" ON public.centers FOR ALL TO authenticated
  USING (public.is_district_admin()) WITH CHECK (public.is_district_admin());

-- ============ OPERATIONAL TABLES ============
CREATE TABLE public.stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  stock int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (center_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock TO authenticated;
GRANT ALL ON public.stock TO service_role;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Staff',
  status text NOT NULL DEFAULT 'idle', -- 'in' | 'out' | 'idle'
  last_marked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  count int NOT NULL DEFAULT 0,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (center_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beds TO authenticated;
GRANT ALL ON public.beds TO service_role;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (center_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tests TO authenticated;
GRANT ALL ON public.tests TO service_role;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pathology_labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  sample_status text NOT NULL DEFAULT 'Pending', -- Collected | Pending
  report_status text NOT NULL DEFAULT 'Pending', -- Ready | Pending
  turnaround_time_hours int NOT NULL DEFAULT 24,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pathology_labs TO authenticated;
GRANT ALL ON public.pathology_labs TO service_role;
ALTER TABLE public.pathology_labs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.requisition_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- medicine | bed | test_kit | other
  item_name text NOT NULL,
  quantity_requested int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'Pending', -- Pending|Approved|Rejected|Dispatched
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisition_requests TO authenticated;
GRANT ALL ON public.requisition_requests TO service_role;
ALTER TABLE public.requisition_requests ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES for operational tables ============
-- Pattern: admin SELECT all; staff full CRUD on their own center.

-- STOCK
CREATE POLICY "admin read stock" ON public.stock FOR SELECT TO authenticated USING (public.is_district_admin());
CREATE POLICY "staff read own stock" ON public.stock FOR SELECT TO authenticated USING (center_id = public.current_center_id());
CREATE POLICY "staff insert own stock" ON public.stock FOR INSERT TO authenticated WITH CHECK (center_id = public.current_center_id() AND NOT public.is_district_admin());
CREATE POLICY "staff update own stock" ON public.stock FOR UPDATE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin()) WITH CHECK (center_id = public.current_center_id());
CREATE POLICY "staff delete own stock" ON public.stock FOR DELETE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin());

-- ATTENDANCE
CREATE POLICY "admin read attendance" ON public.attendance FOR SELECT TO authenticated USING (public.is_district_admin());
CREATE POLICY "staff read own attendance" ON public.attendance FOR SELECT TO authenticated USING (center_id = public.current_center_id());
CREATE POLICY "staff insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (center_id = public.current_center_id() AND NOT public.is_district_admin());
CREATE POLICY "staff update own attendance" ON public.attendance FOR UPDATE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin()) WITH CHECK (center_id = public.current_center_id());
CREATE POLICY "staff delete own attendance" ON public.attendance FOR DELETE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin());

-- BEDS
CREATE POLICY "admin read beds" ON public.beds FOR SELECT TO authenticated USING (public.is_district_admin());
CREATE POLICY "staff read own beds" ON public.beds FOR SELECT TO authenticated USING (center_id = public.current_center_id());
CREATE POLICY "staff insert own beds" ON public.beds FOR INSERT TO authenticated WITH CHECK (center_id = public.current_center_id() AND NOT public.is_district_admin());
CREATE POLICY "staff update own beds" ON public.beds FOR UPDATE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin()) WITH CHECK (center_id = public.current_center_id());
CREATE POLICY "staff delete own beds" ON public.beds FOR DELETE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin());

-- TESTS
CREATE POLICY "admin read tests" ON public.tests FOR SELECT TO authenticated USING (public.is_district_admin());
CREATE POLICY "staff read own tests" ON public.tests FOR SELECT TO authenticated USING (center_id = public.current_center_id());
CREATE POLICY "staff insert own tests" ON public.tests FOR INSERT TO authenticated WITH CHECK (center_id = public.current_center_id() AND NOT public.is_district_admin());
CREATE POLICY "staff update own tests" ON public.tests FOR UPDATE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin()) WITH CHECK (center_id = public.current_center_id());
CREATE POLICY "staff delete own tests" ON public.tests FOR DELETE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin());

-- PATHOLOGY_LABS
CREATE POLICY "admin read pathology" ON public.pathology_labs FOR SELECT TO authenticated USING (public.is_district_admin());
CREATE POLICY "staff read own pathology" ON public.pathology_labs FOR SELECT TO authenticated USING (center_id = public.current_center_id());
CREATE POLICY "staff insert own pathology" ON public.pathology_labs FOR INSERT TO authenticated WITH CHECK (center_id = public.current_center_id() AND NOT public.is_district_admin());
CREATE POLICY "staff update own pathology" ON public.pathology_labs FOR UPDATE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin()) WITH CHECK (center_id = public.current_center_id());
CREATE POLICY "staff delete own pathology" ON public.pathology_labs FOR DELETE TO authenticated USING (center_id = public.current_center_id() AND NOT public.is_district_admin());

-- REQUISITION REQUESTS: staff creates & reads own; admin reads all & updates status
CREATE POLICY "admin read requisitions" ON public.requisition_requests FOR SELECT TO authenticated USING (public.is_district_admin());
CREATE POLICY "staff read own requisitions" ON public.requisition_requests FOR SELECT TO authenticated USING (center_id = public.current_center_id());
CREATE POLICY "staff insert own requisitions" ON public.requisition_requests FOR INSERT TO authenticated WITH CHECK (center_id = public.current_center_id() AND NOT public.is_district_admin());
CREATE POLICY "admin update requisitions" ON public.requisition_requests FOR UPDATE TO authenticated USING (public.is_district_admin()) WITH CHECK (public.is_district_admin());

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_stock_upd BEFORE UPDATE ON public.stock FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_att_upd BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_beds_upd BEFORE UPDATE ON public.beds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tests_upd BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_path_upd BEFORE UPDATE ON public.pathology_labs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED CENTERS ============
INSERT INTO public.centers (center_name, center_type, district) VALUES
  ('Ghatia CHC', 'CHC', 'Ujjain'),
  ('Tarana CHC', 'CHC', 'Ujjain'),
  ('Jharda CHC', 'CHC', 'Ujjain'),
  ('Narwar CHC', 'CHC', 'Ujjain'),
  ('Unhel PHC', 'PHC', 'Ujjain');

-- ============ SEED AUTH USERS ============
-- Placeholder password: HealthSync@2026 (bcrypt hash via crypt)
DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  pwd_hash text := crypt('HealthSync@2026', gen_salt('bf'));
  rec record;
  new_uid uuid;
  center_email text;
BEGIN
  -- Admin
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
    'admin@healthsync.ai', pwd_hash, now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"District Admin"}'::jsonb,
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), admin_id, admin_id::text, jsonb_build_object('sub', admin_id::text, 'email', 'admin@healthsync.ai'), 'email', now(), now(), now());
  INSERT INTO public.profiles (id, full_name, center_id) VALUES (admin_id, 'District Admin', NULL);
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'district_admin');

  -- Center staff accounts
  FOR rec IN SELECT id, center_name FROM public.centers ORDER BY center_name LOOP
    new_uid := gen_random_uuid();
    center_email := lower(replace(replace(rec.center_name, ' CHC', '.chc'), ' PHC', '.phc')) || '@healthsync.ai';

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated',
      center_email, pwd_hash, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec.center_name || ' Staff'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, new_uid::text, jsonb_build_object('sub', new_uid::text, 'email', center_email), 'email', now(), now(), now());
    INSERT INTO public.profiles (id, full_name, center_id) VALUES (new_uid, rec.center_name || ' Staff', rec.id);
    INSERT INTO public.user_roles (user_id, role) VALUES (new_uid, 'center_staff');
  END LOOP;
END $$;

-- ============ SEED OPERATIONAL DATA per center ============
INSERT INTO public.stock (center_id, name, stock)
SELECT c.id, m.name, m.stock FROM public.centers c CROSS JOIN (VALUES
  ('Paracetamol',120),('Amoxicillin',45),('ORS',80),('Insulin',18),
  ('Glucose',60),('Saline',35),('Aspirin',90),('Ibuprofen',55),('Vitamin C',200)
) AS m(name, stock);

INSERT INTO public.attendance (center_id, name, role, status)
SELECT c.id, s.name, s.role, 'idle' FROM public.centers c CROSS JOIN (VALUES
  ('Dr. Rajesh Kumar','Physician'),('Dr. Neha Singh','Pediatrician'),
  ('Nurse Anita','Head Nurse'),('Nurse Rakesh','Nurse')
) AS s(name, role);

INSERT INTO public.beds (center_id, name, count, available)
SELECT c.id, b.name, b.count, b.available FROM public.centers c CROSS JOIN (VALUES
  ('General Beds',24,true),('ICU Beds',4,true),('Emergency Beds',6,false),('Maternity Beds',8,true)
) AS b(name, count, available);

INSERT INTO public.tests (center_id, name, available)
SELECT c.id, t.name, t.available FROM public.centers c CROSS JOIN (VALUES
  ('Blood Test',true),('X-Ray',true),('ECG',true),('COVID Test',false),('Urine Test',true),('CBC',true)
) AS t(name, available);

INSERT INTO public.pathology_labs (center_id, test_name, sample_status, report_status, turnaround_time_hours)
SELECT c.id, p.tn, p.ss, p.rs, p.tt FROM public.centers c CROSS JOIN (VALUES
  ('Complete Blood Count','Collected','Ready',6),
  ('Liver Function','Collected','Pending',24),
  ('Kidney Function','Pending','Pending',24),
  ('Thyroid Panel','Collected','Ready',12),
  ('Blood Sugar','Collected','Ready',2),
  ('Lipid Profile','Pending','Pending',24)
) AS p(tn, ss, rs, tt);
