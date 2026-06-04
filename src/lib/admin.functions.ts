import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function checkPassword(provided: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD not configured");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const PasswordInput = z.object({ password: z.string().min(1).max(256) });

export const adminListSignups = createServerFn({ method: "POST" })
  .inputValidator((d) => PasswordInput.parse(d))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) {
      throw new Error("كلمة المرور غير صحيحة");
    }
    const { data: rows, error } = await supabaseAdmin
      .from("early_signups")
      .select("id, email, shop_url, source, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { signups: rows ?? [], total: rows?.length ?? 0 };
  });
