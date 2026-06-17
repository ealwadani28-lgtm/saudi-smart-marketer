
CREATE TABLE public.store_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  email TEXT,
  store_url TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_refresh_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_analyses_customer ON public.store_analyses(customer_id, created_at DESC);
CREATE INDEX idx_store_analyses_refresh ON public.store_analyses(next_refresh_at) WHERE next_refresh_at IS NOT NULL;

GRANT ALL ON public.store_analyses TO service_role;

ALTER TABLE public.store_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to store_analyses"
  ON public.store_analyses FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TRIGGER trg_store_analyses_updated_at
  BEFORE UPDATE ON public.store_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
