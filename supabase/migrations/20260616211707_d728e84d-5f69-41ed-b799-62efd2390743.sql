
CREATE TABLE public.subscription_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  payment_method text NOT NULL CHECK (payment_method IN ('bank','paypal')),
  reference text,
  notes text,
  amount_sar integer NOT NULL DEFAULT 1500,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX subscription_requests_created_idx ON public.subscription_requests (created_at DESC);
CREATE INDEX subscription_requests_status_idx ON public.subscription_requests (status);

GRANT ALL ON public.subscription_requests TO service_role;

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to subscription_requests"
  ON public.subscription_requests
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
