REVOKE SELECT ON public.early_signups FROM anon, authenticated;
CREATE POLICY "No public read access" ON public.early_signups FOR SELECT TO anon, authenticated USING (false);