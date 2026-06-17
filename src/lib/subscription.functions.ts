import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SubmitInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(5).max(40).optional().nullable(),
  payment_method: z.enum(["bank", "stc_pay", "paypal"]),
  reference: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

const TokenInput = z.object({ token: z.string().min(8).max(512) });
const UpdateInput = z.object({
  token: z.string().min(8).max(512),
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const submitSubscriptionRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => SubmitInput.parse(d))
  .handler(async ({ data }) => {
    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const { hashWithSalt } = await import("./hash.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");

    const ip = getClientIp();
    // 5 per hour per IP
    const rl = await rateLimit("sub_req", ip, 5, 3600);
    if (!rl.allowed) {
      throw new Error(
        `محاولات كثيرة، حاول بعد ${Math.ceil(rl.retryAfter / 60)} دقيقة`,
      );
    }

    let userAgent = "";
    try {
      userAgent = (getRequestHeader("user-agent") ?? "").slice(0, 500);
    } catch {
      /* outside request ctx */
    }

    const { data: row, error } = await supabaseAdmin
      .from("subscription_requests")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone ?? null,
        payment_method: data.payment_method,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        ip_hash: hashWithSalt(ip),
        user_agent: userAgent,
      })
      .select("id, created_at")
      .single();

    if (error) throw new Error(error.message);
    return { ok: true as const, id: row.id, created_at: row.created_at };
  });

export const adminListSubscriptionRequests = createServerFn({ method: "POST" })
  .inputValidator((d) => TokenInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const { data: rows, error } = await supabaseAdmin
      .from("subscription_requests")
      .select(
        "id, full_name, email, phone, payment_method, reference, notes, amount_sar, status, created_at, reviewed_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { requests: rows ?? [] };
  });

export const adminUpdateSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => UpdateInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const now = new Date();
    const reviewedAt = data.status === "pending" ? null : now.toISOString();

    const { data: request, error } = await supabaseAdmin
      .from("subscription_requests")
      .update({
        status: data.status,
        reviewed_at: reviewedAt,
        updated_at: now.toISOString(),
      })
      .eq("id", data.id)
      .select("id, full_name, email, phone, notes, status")
      .single();
    if (error) throw new Error(error.message);

    if (data.status === "approved" && request) {
      const subscriptionStart = now;
      const subscriptionEnd = new Date(subscriptionStart);
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

      const { data: customer, error: customerError } = await supabaseAdmin
        .from("customers")
        .upsert(
          {
            full_name: request.full_name,
            email: request.email,
            subscription_start: subscriptionStart.toISOString(),
            subscription_end: subscriptionEnd.toISOString(),
            status: "active",
            updated_at: now.toISOString(),
          },
          { onConflict: "email" },
        )
        .select("id")
        .single();
      if (customerError) throw new Error(customerError.message);

      const { error: updateError } = await supabaseAdmin
        .from("customer_updates")
        .insert({
          customer_id: customer.id,
          type: "subscription_approved",
          title: "تم تفعيل الاشتراك",
          body: `تم تفعيل اشتراك شهر واحد بناءً على طلب #${request.id.slice(0, 8)}.`,
          done: true,
        });
      if (updateError) throw new Error(updateError.message);
    }

    return { ok: true as const };
  });
