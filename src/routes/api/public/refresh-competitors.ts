import { createFileRoute } from "@tanstack/react-router";
import { fetchStoreHtml, buildSnapshot, type StoreSnapshot } from "@/lib/analyzer.functions";
import {
  diffSnapshots,
  changeIsMeaningful,
  changeToArabic,
} from "@/lib/competitors.functions";

// Daily: pick up to 10 active competitors whose next_check_at <= now(),
// snapshot, diff vs previous, notify customer on meaningful change.
export const Route = createFileRoute("/api/public/refresh-competitors")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: due, error } = await supabaseAdmin
          .from("competitors")
          .select("id, customer_id, competitor_url, competitor_name")
          .eq("active", true)
          .lte("next_check_at", new Date().toISOString())
          .order("next_check_at", { ascending: true })
          .limit(10);

        if (error) {
          console.error("[refresh-competitors] query", error.message);
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const results: Array<{
          id: string;
          status: "checked" | "changed" | "failed";
          error?: string;
        }> = [];

        for (const c of due ?? []) {
          try {
            const html = await fetchStoreHtml(c.competitor_url);
            const snapshot = buildSnapshot(html, c.competitor_url);

            // Get last snapshot for diff
            const { data: prevRow } = await supabaseAdmin
              .from("competitor_snapshots")
              .select("snapshot")
              .eq("competitor_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const prev = (prevRow?.snapshot as StoreSnapshot | undefined) ?? null;
            const changes = prev ? diffSnapshots(prev, snapshot) : null;
            const meaningful = changes ? changeIsMeaningful(changes) : false;

            await supabaseAdmin.from("competitor_snapshots").insert({
              competitor_id: c.id,
              customer_id: c.customer_id,
              snapshot,
              changes: changes ?? null,
              summary: meaningful && changes
                ? changeToArabic(changes, c.competitor_name ?? c.competitor_url)
                : null,
            });

            // Bump next check 14 days, mark checked
            const next = new Date();
            next.setDate(next.getDate() + 14);
            await supabaseAdmin
              .from("competitors")
              .update({
                last_checked_at: new Date().toISOString(),
                next_check_at: next.toISOString(),
              })
              .eq("id", c.id);

            if (meaningful && changes) {
              await supabaseAdmin.from("customer_updates").insert({
                customer_id: c.customer_id,
                type: "competitor",
                title: `تحديث من منافسك — ${c.competitor_name ?? c.competitor_url}`,
                body: changeToArabic(changes, c.competitor_name ?? c.competitor_url),
                done: true,
              });
              results.push({ id: c.id, status: "changed" });
            } else {
              results.push({ id: c.id, status: "checked" });
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : "unknown";
            console.error("[refresh-competitors] failed", c.id, msg);
            const retry = new Date();
            retry.setDate(retry.getDate() + 1);
            await supabaseAdmin
              .from("competitors")
              .update({ next_check_at: retry.toISOString() })
              .eq("id", c.id);
            results.push({ id: c.id, status: "failed", error: msg });
          }
        }

        return Response.json({ ok: true, processed: results.length, results });
      },
    },
  },
});
