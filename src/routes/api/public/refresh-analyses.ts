import { createFileRoute } from "@tanstack/react-router";
import { fetchStoreHtml, buildSnapshot, callGemini } from "@/lib/analyzer.functions";

// Refresh paid analyses whose next_refresh_at <= now().
// Called by pg_cron every day; processes due rows in small batches.
export const Route = createFileRoute("/api/public/refresh-analyses")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: due, error } = await supabaseAdmin
          .from("store_analyses")
          .select("id, customer_id, store_url")
          .eq("tier", "paid")
          .not("next_refresh_at", "is", null)
          .lte("next_refresh_at", new Date().toISOString())
          .order("next_refresh_at", { ascending: true })
          .limit(10);

        if (error) {
          console.error("[refresh-analyses] query error", error.message);
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const results: Array<{ id: string; status: "refreshed" | "failed"; error?: string }> = [];

        for (const row of due ?? []) {
          if (!row.customer_id) continue;
          try {
            const html = await fetchStoreHtml(row.store_url);
            const snapshot = buildSnapshot(html, row.store_url);
            const report = await callGemini(snapshot, "paid");

            const next = new Date();
            next.setDate(next.getDate() + 14);

            // Insert new analysis snapshot
            const { data: inserted, error: insErr } = await supabaseAdmin
              .from("store_analyses")
              .insert({
                customer_id: row.customer_id,
                store_url: row.store_url,
                tier: "paid",
                snapshot,
                report,
                next_refresh_at: next.toISOString(),
              })
              .select("id")
              .single();
            if (insErr) throw insErr;

            // Clear the old row's refresh so it won't trigger again
            await supabaseAdmin
              .from("store_analyses")
              .update({ next_refresh_at: null })
              .eq("id", row.id);

            // Notify customer
            await supabaseAdmin.from("customer_updates").insert({
              customer_id: row.customer_id,
              type: "analysis",
              title: `تحديث تحليل متجرك — ${snapshot.title || row.store_url}`,
              body: report.summary,
              done: true,
            });

            results.push({ id: inserted?.id ?? row.id, status: "refreshed" });
          } catch (e) {
            const msg = e instanceof Error ? e.message : "unknown";
            console.error("[refresh-analyses] failed", row.id, msg);
            // Push refresh forward 1 day so we retry tomorrow instead of looping
            const retry = new Date();
            retry.setDate(retry.getDate() + 1);
            await supabaseAdmin
              .from("store_analyses")
              .update({ next_refresh_at: retry.toISOString() })
              .eq("id", row.id);
            results.push({ id: row.id, status: "failed", error: msg });
          }
        }

        return Response.json({ ok: true, processed: results.length, results });
      },
    },
  },
});
