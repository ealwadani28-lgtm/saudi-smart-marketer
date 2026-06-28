CREATE TABLE public.marketing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.store_analyses(id) ON DELETE SET NULL,
  store_url TEXT NOT NULL,
  plan JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_marketing_plans_customer ON public.marketing_plans(customer_id, created_at DESC);
GRANT SELECT ON public.marketing_plans TO authenticated;
GRANT ALL ON public.marketing_plans TO service_role;
ALTER TABLE public.marketing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny client direct access" ON public.marketing_plans FOR ALL TO authenticated USING (false) WITH CHECK (false);