
CREATE TABLE public.early_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  shop_url TEXT,
  source TEXT NOT NULL DEFAULT 'landing_page',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.early_signups TO anon;
GRANT SELECT, INSERT ON public.early_signups TO authenticated;
GRANT ALL ON public.early_signups TO service_role;

ALTER TABLE public.early_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous visitors) to sign up
CREATE POLICY "Anyone can signup"
  ON public.early_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    AND length(email) <= 255
    AND (shop_url IS NULL OR length(shop_url) <= 500)
  );

-- No SELECT policy = nobody can read emails from client (privacy)
