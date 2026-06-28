
-- KPI tracking: append-only, admin-entered only, with proof + tamper-evident hash
CREATE TABLE public.kpi_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  marketing_plan_id UUID REFERENCES public.marketing_plans(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'all',
  views BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  cost_sar NUMERIC(12,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL,                    -- e.g. 'meta_ads','tiktok_ads','google_ads','ga4','snapchat'
  evidence_url TEXT NOT NULL,              -- screenshot or dashboard link (REQUIRED proof)
  notes TEXT,
  entered_by TEXT NOT NULL,                -- admin identifier
  entry_hash TEXT NOT NULL,                -- SHA-256 over normalized fields (tamper evidence)
  sealed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kpi_period_valid CHECK (period_end >= period_start),
  CONSTRAINT kpi_numbers_nonneg CHECK (views>=0 AND clicks>=0 AND conversions>=0 AND cost_sar>=0),
  CONSTRAINT kpi_evidence_url_shape CHECK (evidence_url ~* '^https?://'),
  CONSTRAINT kpi_source_allowed CHECK (source IN ('meta_ads','tiktok_ads','google_ads','snapchat_ads','x_ads','ga4','search_console','shopify','salla','zid','manual_dashboard'))
);

CREATE INDEX idx_kpi_entries_customer ON public.kpi_entries(customer_id, period_start DESC);
CREATE INDEX idx_kpi_entries_plan ON public.kpi_entries(marketing_plan_id);

-- Auto-compute tamper-evident hash on insert; reject any client-supplied hash mismatch by recomputing.
CREATE OR REPLACE FUNCTION public.kpi_entries_seal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.sealed_at := now();
  NEW.entry_hash := encode(
    digest(
      concat_ws('|',
        NEW.customer_id::text,
        COALESCE(NEW.marketing_plan_id::text,''),
        NEW.period_start::text,
        NEW.period_end::text,
        NEW.channel,
        NEW.views::text,
        NEW.clicks::text,
        NEW.conversions::text,
        NEW.cost_sar::text,
        NEW.source,
        NEW.evidence_url,
        COALESCE(NEW.notes,''),
        NEW.entered_by,
        NEW.sealed_at::text
      ),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

-- pgcrypto is needed for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TRIGGER trg_kpi_entries_seal
BEFORE INSERT ON public.kpi_entries
FOR EACH ROW EXECUTE FUNCTION public.kpi_entries_seal();

-- Block ALL updates and deletes at the database level (append-only / WORM)
CREATE OR REPLACE FUNCTION public.kpi_entries_block_mutations()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'kpi_entries are append-only and cannot be modified or deleted';
END;
$$;

CREATE TRIGGER trg_kpi_entries_no_update
BEFORE UPDATE ON public.kpi_entries
FOR EACH ROW EXECUTE FUNCTION public.kpi_entries_block_mutations();

CREATE TRIGGER trg_kpi_entries_no_delete
BEFORE DELETE ON public.kpi_entries
FOR EACH ROW EXECUTE FUNCTION public.kpi_entries_block_mutations();

-- Grants (server-side admin via service_role; no anon, no client INSERT)
GRANT SELECT ON public.kpi_entries TO authenticated;
GRANT ALL ON public.kpi_entries TO service_role;

ALTER TABLE public.kpi_entries ENABLE ROW LEVEL SECURITY;

-- Customers can READ only their own KPI rows; no insert/update/delete from client (RLS denies by omission).
CREATE POLICY "Customers read their own KPI entries"
ON public.kpi_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = kpi_entries.customer_id
      AND c.user_id = auth.uid()
  )
);
