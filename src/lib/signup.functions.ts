import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  shop_url: z.string().trim().max(500).optional().nullable(),
  source: z.enum(["landing_page", "exit_intent"]).default("landing_page"),
});

export const submitEarlySignup = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    // Lazy server-only imports — keep client bundle clean.
    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip = getClientIp();

    // 5 attempts / 10 min per IP
    const ipLimit = await rateLimit("signup:ip", ip, 5, 600);
    if (!ipLimit.allowed) {
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
        return { ok: true, duplicate: true };
      }
      throw new Error("حدث خطأ، حاول مرة أخرى");
    }

    return { ok: true, duplicate: false };
  });
