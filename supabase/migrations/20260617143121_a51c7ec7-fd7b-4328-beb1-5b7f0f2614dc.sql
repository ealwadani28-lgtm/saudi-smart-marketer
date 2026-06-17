-- Competitors per customer
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  competitor_url TEXT NOT NULL,
  competitor_name TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  next_check_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, competitor_url)
);

GRANT ALL ON public.competitors TO service_role;

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated access. All reads/writes go through server functions
-- (which use the service_role client after verifying the userId).
CREATE POLICY "competitors no direct access" ON public.competitors
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE INDEX idx_competitors_customer ON public.competitors(customer_id);
CREATE INDEX idx_competitors_due ON public.competitors(next_check_at)
  WHERE active = TRUE;

CREATE TRIGGER trg_competitors_updated_at
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Per-check snapshots + diffs
CREATE TABLE public.competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  changes JSONB,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.competitor_snapshots TO service_role;

ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitor_snapshots no direct access" ON public.competitor_snapshots
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE INDEX idx_comp_snapshots_competitor ON public.competitor_snapshots(competitor_id, created_at DESC);
CREATE INDEX idx_comp_snapshots_customer ON public.competitor_snapshots(customer_id, created_at DESC);