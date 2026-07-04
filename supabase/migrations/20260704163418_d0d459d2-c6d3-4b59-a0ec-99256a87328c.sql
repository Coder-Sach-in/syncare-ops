
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('stockout','redistribution','expiry','footfall')),
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  related_center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('high','medium','low')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "District admins can view all insights"
  ON public.ai_insights FOR SELECT
  TO authenticated
  USING (public.is_district_admin());

CREATE POLICY "District admins can insert insights"
  ON public.ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (public.is_district_admin());

CREATE POLICY "District admins can delete insights"
  ON public.ai_insights FOR DELETE
  TO authenticated
  USING (public.is_district_admin());

CREATE INDEX idx_ai_insights_generated_at ON public.ai_insights(generated_at DESC);
