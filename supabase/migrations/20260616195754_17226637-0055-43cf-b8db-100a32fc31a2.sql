-- ============ Audit: signup_attempts ============
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text,
  email_hash text,
  user_agent text,
  source text,
  status text NOT NULL CHECK (status IN ('success','rejected')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signup_attempts_created_at_idx ON public.signup_attempts (created_at DESC);
CREATE INDEX IF NOT EXISTS signup_attempts_status_idx ON public.signup_attempts (status, created_at DESC);

GRANT ALL ON public.signup_attempts TO service_role;
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to signup_attempts"
  ON public.signup_attempts FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ============ Security alerts ============
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warn','critical')),
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_alerts_open_idx
  ON public.security_alerts (created_at DESC) WHERE resolved_at IS NULL;

GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to security_alerts"
  ON public.security_alerts FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ============ Visitor pings (live counter) ============
CREATE TABLE IF NOT EXISTS public.visitor_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS visitor_pings_created_at_idx ON public.visitor_pings (created_at DESC);
CREATE INDEX IF NOT EXISTS visitor_pings_ip_recent_idx ON public.visitor_pings (ip_hash, created_at DESC);

GRANT ALL ON public.visitor_pings TO service_role;
ALTER TABLE public.visitor_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to visitor_pings"
  ON public.visitor_pings FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ============ Function: spike detection ============
CREATE OR REPLACE FUNCTION public.detect_signup_spike()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_10min int;
  prev_hour_avg numeric;
  threshold int;
  recent_alert_count int;
BEGIN
  SELECT count(*) INTO last_10min
  FROM public.signup_attempts
  WHERE created_at > now() - interval '10 minutes';

  -- average per 10-min window across the previous hour (excluding the current window)
  SELECT COALESCE(count(*)::numeric / 6.0, 0) INTO prev_hour_avg
  FROM public.signup_attempts
  WHERE created_at > now() - interval '70 minutes'
    AND created_at <= now() - interval '10 minutes';

  -- trigger if: >= 20 attempts in 10 min AND >= 3x baseline (or baseline near zero)
  threshold := GREATEST(20, CEIL(prev_hour_avg * 3)::int);

  IF last_10min >= threshold THEN
    -- don't spam: skip if an open spike alert was created in last 30 min
    SELECT count(*) INTO recent_alert_count
    FROM public.security_alerts
    WHERE kind = 'signup_spike'
      AND resolved_at IS NULL
      AND created_at > now() - interval '30 minutes';

    IF recent_alert_count = 0 THEN
      INSERT INTO public.security_alerts (kind, severity, message, metadata)
      VALUES (
        'signup_spike',
        CASE WHEN last_10min >= threshold * 2 THEN 'critical' ELSE 'warn' END,
        format('ارتفاع غير طبيعي في محاولات التسجيل: %s محاولة في آخر 10 دقائق (المتوسط الطبيعي %s)',
               last_10min, round(prev_hour_avg, 1)),
        jsonb_build_object(
          'last_10min', last_10min,
          'baseline_avg', prev_hour_avg,
          'threshold', threshold
        )
      );
    END IF;
  END IF;
END;
$$;

-- ============ Function: log_signup_attempt ============
CREATE OR REPLACE FUNCTION public.log_signup_attempt(
  _ip_hash text,
  _email_hash text,
  _user_agent text,
  _source text,
  _status text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.signup_attempts (ip_hash, email_hash, user_agent, source, status, reason)
  VALUES (_ip_hash, _email_hash, _user_agent, _source, _status, _reason);

  PERFORM public.detect_signup_spike();
END;
$$;

-- ============ Function: record_visitor_ping ============
CREATE OR REPLACE FUNCTION public.record_visitor_ping(
  _ip_hash text,
  _path text
)
RETURNS TABLE(active_now int, today_total int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_ping timestamptz;
BEGIN
  -- throttle: don't insert if same ip pinged in last 60s
  SELECT max(created_at) INTO last_ping
  FROM public.visitor_pings
  WHERE ip_hash = _ip_hash AND created_at > now() - interval '60 seconds';

  IF last_ping IS NULL THEN
    INSERT INTO public.visitor_pings (ip_hash, path)
    VALUES (_ip_hash, _path);
  END IF;

  -- distinct visitors active in last 5 minutes
  SELECT count(DISTINCT ip_hash)::int INTO active_now
  FROM public.visitor_pings
  WHERE created_at > now() - interval '5 minutes';

  -- distinct visitors today (UTC)
  SELECT count(DISTINCT ip_hash)::int INTO today_total
  FROM public.visitor_pings
  WHERE created_at >= date_trunc('day', now());

  RETURN NEXT;
END;
$$;

-- ============ Function: cleanup_old_telemetry ============
CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.visitor_pings WHERE created_at < now() - interval '24 hours';
  DELETE FROM public.signup_attempts WHERE created_at < now() - interval '90 days';
  DELETE FROM public.security_alerts
    WHERE resolved_at IS NOT NULL AND resolved_at < now() - interval '90 days';
END;
$$;

REVOKE ALL ON FUNCTION public.detect_signup_spike() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.log_signup_attempt(text,text,text,text,text,text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.record_visitor_ping(text,text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_telemetry() FROM anon, authenticated;
