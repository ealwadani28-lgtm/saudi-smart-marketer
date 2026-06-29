
CREATE TABLE public.monitored_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.monitored_domains TO service_role;
ALTER TABLE public.monitored_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role full access monitored_domains"
  ON public.monitored_domains FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.domain_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES public.monitored_domains(id) ON DELETE CASCADE,
  domain text NOT NULL,
  source text NOT NULL DEFAULT 'ssllabs',
  status text NOT NULL DEFAULT 'pending',
  grade text,
  has_warnings boolean,
  cert_subject text,
  cert_issuer text,
  cert_valid_from timestamptz,
  cert_valid_to timestamptz,
  protocols jsonb,
  endpoints jsonb,
  raw_result jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX domain_scans_domain_id_started_idx
  ON public.domain_scans (domain_id, started_at DESC);

GRANT ALL ON public.domain_scans TO service_role;
ALTER TABLE public.domain_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role full access domain_scans"
  ON public.domain_scans FOR ALL TO service_role USING (true) WITH CHECK (true);
