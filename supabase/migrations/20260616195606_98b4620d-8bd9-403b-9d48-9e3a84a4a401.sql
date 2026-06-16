-- Belt-and-suspenders: explicit INSERT-deny policy on early_signups.
-- INSERT privilege is already revoked from anon/authenticated, and signups
-- go through a server function using the service role (which bypasses RLS).
-- This policy makes the deny explicit for scanners and future readers.

DROP POLICY IF EXISTS "No client inserts" ON public.early_signups;
CREATE POLICY "No client inserts"
  ON public.early_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates" ON public.early_signups;
CREATE POLICY "No client updates"
  ON public.early_signups
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes" ON public.early_signups;
CREATE POLICY "No client deletes"
  ON public.early_signups
  FOR DELETE
  TO anon, authenticated
  USING (false);
