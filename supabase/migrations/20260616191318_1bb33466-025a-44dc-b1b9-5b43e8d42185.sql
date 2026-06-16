
-- ============ early_signups hardening ============
ALTER TABLE public.early_signups ADD COLUMN IF NOT EXISTS ip inet;
CREATE UNIQUE INDEX IF NOT EXISTS early_signups_email_lower_uniq ON public.early_signups (lower(email));
CREATE INDEX IF NOT EXISTS early_signups_created_at_idx ON public.early_signups (created_at DESC);

-- Revoke direct INSERT from anon/authenticated — only service_role (server fn) writes now
REVOKE INSERT ON public.early_signups FROM anon, authenticated;
DROP POLICY IF EXISTS "Anyone can signup" ON public.early_signups;

-- ============ rate_limits table ============
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No grants to anon/authenticated — service_role only
GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no client access" ON public.rate_limits
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- Atomic increment helper
CREATE OR REPLACE FUNCTION public.rl_hit(_key text, _limit int, _window_seconds int)
RETURNS TABLE (allowed boolean, remaining int, retry_after int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.rate_limits%ROWTYPE;
  win_start timestamptz;
BEGIN
  win_start := now() - make_interval(secs => _window_seconds);

  INSERT INTO public.rate_limits (key, count, window_start, updated_at)
  VALUES (_key, 1, now(), now())
  ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN public.rate_limits.window_start < win_start THEN 1
                     ELSE public.rate_limits.count + 1 END,
        window_start = CASE WHEN public.rate_limits.window_start < win_start THEN now()
                            ELSE public.rate_limits.window_start END,
        updated_at = now()
  RETURNING * INTO row;

  allowed := row.count <= _limit;
  remaining := GREATEST(_limit - row.count, 0);
  retry_after := GREATEST(
    EXTRACT(EPOCH FROM (row.window_start + make_interval(secs => _window_seconds) - now()))::int,
    0
  );
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.rl_hit(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rl_hit(text, int, int) TO service_role;
