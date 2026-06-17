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
  .inputValidator((d) => LoginInput.parse(d))
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
  .inputValidator((d) => TokenInput.parse(d))
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

const CustomerViewInput = z.object({
  token: z.string().min(8).max(512),
  email: z.string().email().max(256),
});

const AdminAnalyzeInput = z.object({
  token: z.string().min(8).max(512),
  email: z.string().email().max(256),
  storeUrl: z
    .string()
    .trim()
    .min(4)
    .max(500)
    .transform((s) => (s.startsWith("http") ? s : `https://${s}`))
    .refine((s) => {
      try {
        const u = new URL(s);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "رابط غير صالح"),
});

/**
 * Admin read-only view of a customer's workspace data.
 * Does NOT impersonate the customer — admin sees the data within the admin panel.
 */
export const adminGetCustomerView = createServerFn({ method: "POST" })
  .inputValidator((d) => CustomerViewInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!verifyAdminToken(data.token)) {
      throw new Error("Unauthorized");
    }

    const { data: customer, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id, full_name, email, shop_url, shop_name, subscription_start, subscription_end, status, created_at")
      .eq("email", data.email)
      .maybeSingle();

    if (cErr) throw new Error(cErr.message);
    if (!customer) throw new Error("لم يتم العثور على عميل بهذا البريد");

    const [updatesRes, analysesRes, competitorsRes] = await Promise.all([
      supabaseAdmin
        .from("customer_updates")
        .select("id, type, title, body, done, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("store_analyses")
        .select("id, store_url, snapshot, report, created_at, next_refresh_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("competitors")
        .select("id, competitor_url, competitor_name, source, active, last_checked_at, next_check_at, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false }),
    ]);

    return {
      customer,
      updates: updatesRes.data ?? [],
      analyses: analysesRes.data ?? [],
      competitors: competitorsRes.data ?? [],
    };
  });

export const adminAnalyzeCustomerStore = createServerFn({ method: "POST" })
  .inputValidator((d) => AdminAnalyzeInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { fetchStoreHtml, buildSnapshot, callGemini } = await import("./analyzer.functions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!verifyAdminToken(data.token)) {
      throw new Error("Unauthorized");
    }

    const { data: customer, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id, status")
      .eq("email", data.email)
      .single();
    if (cErr || !customer) throw new Error("لم نجد مساحة عمل لهذا العميل");
    if (customer.status !== "active") throw new Error("اشتراك العميل غير مفعّل");

    const html = await fetchStoreHtml(data.storeUrl);
    const snapshot = buildSnapshot(html, data.storeUrl);
    const report = await callGemini(snapshot, "paid");
    const refreshAt = new Date();
    refreshAt.setDate(refreshAt.getDate() + 14);

    const { data: row, error } = await supabaseAdmin
      .from("store_analyses")
      .insert({
        customer_id: customer.id,
        store_url: data.storeUrl,
        tier: "paid",
        snapshot,
        report,
        next_refresh_at: refreshAt.toISOString(),
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(`فشل حفظ التحليل: ${error.message}`);

    await supabaseAdmin
      .from("customers")
      .update({ shop_url: data.storeUrl, shop_name: snapshot.title || null })
      .eq("id", customer.id);

    await supabaseAdmin.from("customer_updates").insert({
      customer_id: customer.id,
      type: "analysis",
      title: `تحليل المتجر جاهز — ${snapshot.title || data.storeUrl}`,
      body: report.summary,
      done: true,
    });

    return { id: row?.id, snapshot, report, createdAt: row?.created_at };
  });


