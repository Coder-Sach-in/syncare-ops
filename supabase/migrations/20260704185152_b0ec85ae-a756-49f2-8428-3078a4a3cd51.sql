
CREATE TABLE public.patient_footfall (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  patient_count integer NOT NULL DEFAULT 0 CHECK (patient_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (center_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_footfall TO authenticated;
GRANT ALL ON public.patient_footfall TO service_role;

ALTER TABLE public.patient_footfall ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own center footfall"
  ON public.patient_footfall FOR SELECT TO authenticated
  USING (center_id = public.current_center_id() OR public.is_district_admin());

CREATE POLICY "Staff can insert own center footfall"
  ON public.patient_footfall FOR INSERT TO authenticated
  WITH CHECK (center_id = public.current_center_id());

CREATE POLICY "Staff can update own center footfall"
  ON public.patient_footfall FOR UPDATE TO authenticated
  USING (center_id = public.current_center_id())
  WITH CHECK (center_id = public.current_center_id());

CREATE POLICY "Staff can delete own center footfall"
  ON public.patient_footfall FOR DELETE TO authenticated
  USING (center_id = public.current_center_id());

CREATE TRIGGER set_patient_footfall_updated_at
  BEFORE UPDATE ON public.patient_footfall
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
