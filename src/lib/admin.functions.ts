import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { timingSafeEqual } from "crypto";

function checkPassword(provided: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD not configured");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const LoginInput = z.object({ password: z.string().min(1).max(256) });
const TokenInput = z.object({ token: z.string().min(8).max(512) });

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d) => LoginInput.parse(d))
  .handler(async ({ data }) => {
    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const { issueAdminToken } = await import("./admin-token.server");

    const ip = getClientIp();
    // 5 attempts per 15 min per IP
    const rl = await rateLimit("admin:login", ip, 5, 900);
    if (!rl.allowed) {
      throw new Error(`محاولات كثيرة، حاول بعد ${Math.ceil(rl.retryAfter / 60)} دقيقة`);
    }

    if (!checkPassword(data.password)) {
      throw new Error("كلمة المرور غير صحيحة");
    }

    return { token: issueAdminToken() };
  });

export const adminListSignups = createServerFn({ method: "POST" })
  .validator((d) => TokenInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!verifyAdminToken(data.token)) {
      throw new Error("Unauthorized");
    }

    const { data: rows, error } = await supabaseAdmin
      .from("early_signups")
      .select("id, email, shop_url, source, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { signups: rows ?? [], total: rows?.length ?? 0 };
  });
