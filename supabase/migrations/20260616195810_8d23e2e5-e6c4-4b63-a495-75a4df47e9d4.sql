REVOKE ALL ON FUNCTION public.detect_signup_spike() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_signup_attempt(text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_visitor_ping(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_telemetry() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.detect_signup_spike() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_signup_attempt(text,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_visitor_ping(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_telemetry() TO service_role;

-- Also harden the pre-existing rl_hit function the same way
REVOKE ALL ON FUNCTION public.rl_hit(text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rl_hit(text,integer,integer) TO service_role;
