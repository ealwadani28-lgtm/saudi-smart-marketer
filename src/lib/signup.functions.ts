import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  shop_url: z.string().trim().max(500).optional().nullable(),
  source: z.enum(["landing_page", "exit_intent"]).default("landing_page"),
});

export const submitEarlySignup = createServerFn({ method: "POST" })
  .validator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    // Lazy server-only imports — keep client bundle clean.
    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const { hashWithSalt } = await import("./hash.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");

    const ip = getClientIp();
    const ipHash = hashWithSalt(ip);
    const emailHash = hashWithSalt(data.email);
    let userAgent = "";
    try {
      userAgent = (getRequestHeader("user-agent") ?? "").slice(0, 500);
    } catch {
      /* outside request ctx */
    }

    async function audit(status: "success" | "rejected", reason: string | null) {
      try {
        await supabaseAdmin.rpc("log_signup_attempt", {
          _ip_hash: ipHash,
          _email_hash: emailHash,
          _user_agent: userAgent,
          _source: data.source,
          _status: status,
          _reason: reason ?? "",
        });
      } catch {
        // Audit must never break the user flow.
      }
    }

    // 5 attempts / 10 min per IP
    const ipLimit = await rateLimit("signup:ip", ip, 5, 600);
    if (!ipLimit.allowed) {
      await audit("rejected", "rate_limited");
      throw new Error("محاولات كثيرة، حاول بعد قليل");
    }

    const { error } = await supabaseAdmin.from("early_signups").insert({
      email: data.email,
      shop_url: data.shop_url || null,
      source: data.source,
      ip: ip === "unknown" ? null : ip,
    });

    if (error) {
      // 23505 = unique_violation on lower(email). Treat as success — no enumeration leak.
      if ((error as { code?: string }).code === "23505") {
        await audit("rejected", "duplicate_email");
        return { ok: true, duplicate: true };
      }
      await audit("rejected", "db_error");
      throw new Error("حدث خطأ، حاول مرة أخرى");
    }

    await audit("success", null);
    return { ok: true, duplicate: false };
  });
