
-- Explicit anon deny policies (defense-in-depth)
CREATE POLICY "Deny anon access" ON public.competitors AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon access" ON public.competitor_snapshots AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny anon access" ON public.marketing_plans AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Explicit deny INSERT/UPDATE/DELETE on kpi_entries for anon & authenticated (writes only via service_role)
CREATE POLICY "Deny writes to anon and authenticated" ON public.kpi_entries AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Deny updates to anon and authenticated" ON public.kpi_entries AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny deletes to anon and authenticated" ON public.kpi_entries AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "Deny anon select" ON public.kpi_entries AS RESTRICTIVE FOR SELECT TO anon USING (false);
