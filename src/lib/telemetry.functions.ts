import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PingInput = z.object({
  path: z.string().trim().max(200).optional().nullable(),
});

const TokenInput = z.object({ token: z.string().min(8).max(512) });

const ResolveInput = z.object({
  token: z.string().min(8).max(512),
  alertId: z.string().uuid(),
});

/**
 * Public visitor heartbeat. Returns active-now + today distinct counts.
 * Throttled server-side (per-IP 60s) inside the DB function.
 */
export const pingVisitor = createServerFn({ method: "POST" })
  .validator((d) => PingInput.parse(d))
  .handler(async ({ data }) => {
    const { getClientIp } = await import("./rate-limit.server");
    const { hashWithSalt } = await import("./hash.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip = getClientIp();
    const ipHash = hashWithSalt(ip);

    try {
      const { data: rows, error } = await supabaseAdmin.rpc("record_visitor_ping", {
        _ip_hash: ipHash,
        _path: data.path ?? "",
      });
      if (error || !rows || !Array.isArray(rows) || rows.length === 0) {
        return { activeNow: 0, todayTotal: 0 };
      }
      const row = rows[0] as { active_now: number; today_total: number };
      return { activeNow: row.active_now ?? 0, todayTotal: row.today_total ?? 0 };
    } catch {
      return { activeNow: 0, todayTotal: 0 };
    }
  });

export const adminGetAlerts = createServerFn({ method: "POST" })
  .validator((d) => TokenInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const { data: rows, error } = await supabaseAdmin
      .from("security_alerts")
      .select("id, kind, severity, message, metadata, resolved_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { alerts: rows ?? [] };
  });

export const adminResolveAlert = createServerFn({ method: "POST" })
  .validator((d) => ResolveInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const { error } = await supabaseAdmin
      .from("security_alerts")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", data.alertId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetSignupAttempts = createServerFn({ method: "POST" })
  .validator((d) => TokenInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from("signup_attempts")
      .select("id, status, reason, source, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const all = rows ?? [];
    const last10min = all.filter(
      (r) => new Date(r.created_at).getTime() > Date.now() - 10 * 60 * 1000,
    );
    return {
      attempts: all,
      stats: {
        last24h: all.length,
        last10min: last10min.length,
        successLast24h: all.filter((r) => r.status === "success").length,
        rejectedLast24h: all.filter((r) => r.status === "rejected").length,
      },
    };
  });
