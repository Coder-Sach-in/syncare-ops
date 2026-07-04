ALTER TABLE public.ai_insights
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS suggested_quantity integer;