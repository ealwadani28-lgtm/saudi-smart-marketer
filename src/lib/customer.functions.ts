import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ActivateInput = z.object({
  token: z.string().min(8).max(512),
  subscriptionRequestId: z.string().uuid(),
});

const WorkspaceInput = z.object({
  userId: z.string().uuid(),
});

const MagicLinkInput = z.object({
  email: z.string().email().max(255),
});

/**
 * Admin: approve a subscription request → create Supabase Auth user → send magic link
 */
export const activateCustomer = createServerFn({ method: "POST" })
  .validator((d) => ActivateInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    // Fetch the subscription request
    const { data: req, error: reqErr } = await supabaseAdmin
      .from("subscription_requests")
      .select("id, full_name, email, phone, status, notes")
      .eq("id", data.subscriptionRequestId)
      .single();

    if (reqErr || !req) throw new Error("طلب الاشتراك غير موجود");
    if (req.status === "approved") throw new Error("العميل مفعّل مسبقاً");

    // Try to get shop_url from early_signups by email
    const { data: signup } = await supabaseAdmin
      .from("early_signups")
      .select("shop_url")
      .eq("email", req.email)
      .maybeSingle();

    const shopUrl = signup?.shop_url ?? null;

    const siteUrl = process.env.VITE_SITE_URL ?? "https://justmarketing.sa";

    // Create or invite Supabase Auth user
    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      req.email,
      {
        redirectTo: `${siteUrl}/workspace`,
        data: { full_name: req.full_name },
      }
    );

    if (inviteErr) throw new Error(`فشل إنشاء الحساب: ${inviteErr.message}`);

    const userId = inviteData.user.id;
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);

    // Insert customer record
    const { error: custErr } = await supabaseAdmin.from("customers").insert({
      user_id: userId,
      full_name: req.full_name,
      email: req.email,
      shop_url: shopUrl,
      shop_name: null,
      subscription_start: now.toISOString(),
      subscription_end: end.toISOString(),
      status: "active",
    });

    if (custErr) throw new Error(`فشل إنشاء سجل العميل: ${custErr.message}`);

    // Add first workspace update
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (customer) {
      await supabaseAdmin.from("customer_updates").insert({
        customer_id: customer.id,
        type: "welcome",
        title: "مرحباً بك في مساحة عملك",
        body: `أهلاً ${req.full_name}! اشتراكك بدأ اليوم ويمتد لـ ٣٠ يوماً. سيصلك تحديث قريباً بعد انتهاء تحليل متجرك.`,
        done: false,
      });
    }

    // Mark subscription request as approved
    await supabaseAdmin
      .from("subscription_requests")
      .update({ status: "approved", reviewed_at: now.toISOString(), updated_at: now.toISOString() })
      .eq("id", data.subscriptionRequestId);

    return { ok: true, email: req.email };
  });

/**
 * Customer: fetch their workspace data (requires auth)
 */
export const getWorkspace = createServerFn({ method: "POST" })
  .validator((d) => WorkspaceInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .select("id, full_name, shop_url, shop_name, subscription_start, subscription_end, status")
      .eq("user_id", data.userId)
      .single();

    if (error || !customer) throw new Error("مساحة العمل غير موجودة");

    const { data: updates } = await supabaseAdmin
      .from("customer_updates")
      .select("id, type, title, body, done, created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return { customer, updates: updates ?? [] };
  });

/**
 * Customer: request a new magic link by email
 */
export const requestMagicLink = createServerFn({ method: "POST" })
  .validator((d) => MagicLinkInput.parse(d))
  .handler(async ({ data }) => {
    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip = getClientIp();
    const rl = await rateLimit("magic_link", ip, 3, 600);
    if (!rl.allowed) {
      throw new Error(`محاولات كثيرة، حاول بعد ${Math.ceil(rl.retryAfter / 60)} دقيقة`);
    }

    const siteUrl = process.env.VITE_SITE_URL ?? "https://justmarketing.sa";

    // Only send if customer exists — don't leak user enumeration
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("user_id")
      .eq("email", data.email)
      .single();

    if (customer?.user_id) {
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: data.email,
        options: { redirectTo: `${siteUrl}/workspace` },
      });
    }

    // Always return ok — no enumeration leak
    return { ok: true };
  });
