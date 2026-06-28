import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SubmitProofInput = z.object({
  subscriptionRequestId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(255),
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(3).max(100),
  // base64 (no data URL prefix), max ~6MB raw → ~8MB base64
  base64: z.string().min(100).max(8_500_000),
});

const PRICE_SAR = 1500;
// PayPal alternative: accept >= ~$380 USD (1500 SAR at conservative rate ~3.95)
const MIN_USD = 380;
const PAYEE_KEYWORDS = ["alwadani", "essa", "justlator", "justmarketer", "عيسى", "الوادعي"];
const IBAN_TAIL = "0395800"; // last digits of project IBAN

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

interface ExtractedReceipt {
  amount: number | null;
  currency: string | null;
  reference: string | null;
  payee: string | null;
  date: string | null;
  is_receipt: boolean;
  confidence: "low" | "medium" | "high";
  notes: string;
}

async function extractReceipt(
  base64: string,
  mimeType: string,
): Promise<ExtractedReceipt> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY غير متاح");

  const sys =
    "أنت محلل إيصالات دفع. استخرج بيانات الإيصال بدقة وأعد JSON فقط. إذا لم تكن الصورة إيصال دفع حقيقي ضع is_receipt=false.";

  const userParts: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: `استخرج من إيصال الدفع:
- amount: المبلغ كرقم (بدون فواصل أو رمز عملة)
- currency: العملة (SAR/USD/EUR إلخ)
- reference: رقم العملية أو المرجع
- payee: اسم المستفيد كما ظهر بالضبط
- date: تاريخ العملية ISO YYYY-MM-DD
- is_receipt: true فقط إذا كان إيصال دفع حقيقي
- confidence: low/medium/high حسب وضوح الإيصال
- notes: ملاحظة قصيرة بالعربي عن أي شيء غير واضح

أعد JSON فقط بدون أي نص آخر.`,
    },
  ];

  if (mimeType === "application/pdf") {
    userParts.push({
      type: "file",
      file: {
        filename: "receipt.pdf",
        file_data: `data:application/pdf;base64,${base64}`,
      },
    });
  } else {
    userParts.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${base64}` },
    });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userParts },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`فشل قراءة الإيصال: ${res.status} ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content) as Partial<ExtractedReceipt>;
    return {
      amount:
        typeof parsed.amount === "number"
          ? parsed.amount
          : parsed.amount
          ? Number(String(parsed.amount).replace(/[^\d.]/g, "")) || null
          : null,
      currency: parsed.currency ?? null,
      reference: parsed.reference ?? null,
      payee: parsed.payee ?? null,
      date: parsed.date ?? null,
      is_receipt: parsed.is_receipt !== false,
      confidence: (parsed.confidence as ExtractedReceipt["confidence"]) ?? "low",
      notes: parsed.notes ?? "",
    };
  } catch {
    return {
      amount: null,
      currency: null,
      reference: null,
      payee: null,
      date: null,
      is_receipt: false,
      confidence: "low",
      notes: "تعذّر تحليل استجابة الذكاء الاصطناعي",
    };
  }
}

function evaluateMatch(
  ex: ExtractedReceipt,
  ourReference: string | null,
): { match: boolean; reason: string } {
  if (!ex.is_receipt) return { match: false, reason: "الملف لا يبدو كإيصال دفع" };

  // Amount check
  const cur = (ex.currency || "").toUpperCase();
  const amt = ex.amount ?? 0;
  let amountOk = false;
  if (cur.includes("SAR") || cur.includes("ريال") || cur === "") {
    amountOk = amt >= PRICE_SAR * 0.99;
  } else if (cur.includes("USD") || cur === "$") {
    amountOk = amt >= MIN_USD;
  } else if (cur.includes("EUR") || cur === "€") {
    amountOk = amt >= MIN_USD * 0.95;
  } else {
    amountOk = amt >= PRICE_SAR * 0.99; // fallback assume SAR
  }
  if (!amountOk) {
    return {
      match: false,
      reason: `المبلغ المستخرج (${amt} ${cur || "غير محدد"}) أقل من قيمة الاشتراك`,
    };
  }

  // Payee match
  const payeeLower = (ex.payee || "").toLowerCase();
  const refLower = (ex.reference || "").toLowerCase();
  const allText = `${payeeLower} ${refLower}`;
  const payeeOk =
    PAYEE_KEYWORDS.some((k) => allText.includes(k)) ||
    refLower.includes(IBAN_TAIL) ||
    payeeLower.includes(IBAN_TAIL);

  if (!payeeOk) {
    return {
      match: false,
      reason: `اسم المستفيد المستخرج (${ex.payee || "غير محدد"}) لا يطابق حسابنا`,
    };
  }

  // Bonus: cross-check user-provided reference if any
  if (ourReference && ex.reference) {
    const a = ourReference.replace(/\s+/g, "").toLowerCase();
    const b = ex.reference.replace(/\s+/g, "").toLowerCase();
    if (a.length >= 4 && !b.includes(a) && !a.includes(b)) {
      // Mismatch is suspicious but not blocking — flag for review
      return {
        match: false,
        reason: "رقم العملية المكتوب لا يطابق ما في الإيصال",
      };
    }
  }

  if (ex.confidence === "low") {
    return { match: false, reason: "جودة الإيصال منخفضة — يحتاج مراجعة بشرية" };
  }

  return { match: true, reason: "تمت المطابقة تلقائياً" };
}

export const submitPaymentProof = createServerFn({ method: "POST" })
  .inputValidator((d) => SubmitProofInput.parse(d))
  .handler(async ({ data }) => {
    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip = getClientIp();
    // 5 uploads / hour / IP
    const rl = await rateLimit("proof_upload", ip, 5, 3600);
    if (!rl.allowed) {
      throw new Error(
        `محاولات كثيرة، حاول بعد ${Math.ceil(rl.retryAfter / 60)} دقيقة`,
      );
    }

    if (!ALLOWED_MIME.has(data.mimeType)) {
      throw new Error("نوع الملف غير مدعوم (الصور أو PDF فقط)");
    }

    // Decode base64
    const buf = Buffer.from(data.base64, "base64");
    if (buf.length > 6 * 1024 * 1024) {
      throw new Error("الحد الأقصى لحجم الملف 6 ميجابايت");
    }
    if (buf.length < 1000) {
      throw new Error("الملف صغير جداً أو تالف");
    }

    // Fetch request + verify email matches
    const { data: req, error: reqErr } = await supabaseAdmin
      .from("subscription_requests")
      .select(
        "id, email, full_name, status, verification_status, verification_attempts, reference",
      )
      .eq("id", data.subscriptionRequestId)
      .maybeSingle();
    if (reqErr || !req) throw new Error("طلب الاشتراك غير موجود");
    if (req.email.toLowerCase() !== data.email.toLowerCase()) {
      throw new Error("البريد لا يطابق طلب الاشتراك");
    }
    if (req.status === "approved") {
      return {
        ok: true as const,
        auto_verified: true,
        already_active: true,
        message: "حسابك مفعّل مسبقاً",
      };
    }
    if ((req.verification_attempts ?? 0) >= 3) {
      throw new Error("تم استنفاد محاولات الرفع التلقائي. تواصل عبر واتساب.");
    }

    // Upload to private bucket
    const ext = data.fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${req.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("payment-proofs")
      .upload(path, buf, { contentType: data.mimeType, upsert: false });
    if (upErr) throw new Error(`فشل رفع الإيصال: ${upErr.message}`);

    // Extract via Gemini Vision
    let extracted: ExtractedReceipt;
    try {
      extracted = await extractReceipt(data.base64, data.mimeType);
    } catch (e) {
      // Save path + needs_review on extraction failure
      await supabaseAdmin
        .from("subscription_requests")
        .update({
          proof_path: path,
          verification_status: "needs_review",
          verification_notes: e instanceof Error ? e.message : "فشل التحليل",
          verification_attempts: (req.verification_attempts ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.id);
      return {
        ok: true as const,
        auto_verified: false,
        message: "تم رفع الإيصال — قيد المراجعة اليدوية",
      };
    }

    const verdict = evaluateMatch(extracted, req.reference);
    const now = new Date();

    // Save extraction first
    await supabaseAdmin
      .from("subscription_requests")
      .update({
        proof_path: path,
        extracted_amount: extracted.amount,
        extracted_currency: extracted.currency,
        extracted_reference: extracted.reference,
        extracted_payee: extracted.payee,
        extracted_date: extracted.date,
        verification_status: verdict.match ? "auto_verified" : "needs_review",
        verification_notes: verdict.reason + (extracted.notes ? ` | ${extracted.notes}` : ""),
        verification_attempts: (req.verification_attempts ?? 0) + 1,
        verified_at: verdict.match ? now.toISOString() : null,
        updated_at: now.toISOString(),
      })
      .eq("id", req.id);

    if (!verdict.match) {
      return {
        ok: true as const,
        auto_verified: false,
        message: `تم رفع الإيصال. السبب: ${verdict.reason}. سنراجعه يدوياً خلال ساعات.`,
      };
    }

    // Auto-activate: create auth user + customer record (same logic as activateCustomer)
    try {
      const siteUrl = process.env.VITE_SITE_URL ?? "https://saudi-smart-marketer.lovable.app";

      // Skip if user already exists
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers")
        .select("id, user_id")
        .eq("email", req.email)
        .maybeSingle();

      let userId = existingCustomer?.user_id ?? null;

      if (!userId) {
        const { data: invite, error: invErr } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(req.email, {
            redirectTo: `${siteUrl}/workspace`,
            data: { full_name: req.full_name },
          });
        if (invErr || !invite?.user) {
          throw new Error(invErr?.message || "فشل إنشاء الحساب");
        }
        userId = invite.user.id;
      }

      const end = new Date(now);
      end.setDate(end.getDate() + 30);

      if (existingCustomer) {
        await supabaseAdmin
          .from("customers")
          .update({
            subscription_start: now.toISOString(),
            subscription_end: end.toISOString(),
            status: "active",
          })
          .eq("id", existingCustomer.id);
      } else {
        const { data: signup } = await supabaseAdmin
          .from("early_signups")
          .select("shop_url")
          .eq("email", req.email)
          .maybeSingle();

        await supabaseAdmin.from("customers").insert({
          user_id: userId,
          full_name: req.full_name,
          email: req.email,
          shop_url: signup?.shop_url ?? null,
          subscription_start: now.toISOString(),
          subscription_end: end.toISOString(),
          status: "active",
        });
      }

      // Welcome update
      const { data: cust } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("email", req.email)
        .maybeSingle();
      if (cust) {
        await supabaseAdmin.from("customer_updates").insert({
          customer_id: cust.id,
          type: "welcome",
          title: "مرحباً بك — تم التفعيل تلقائياً",
          body: `أهلاً ${req.full_name}! تم التحقق من إيصالك تلقائياً وتفعيل اشتراكك لمدة ٣٠ يوماً.`,
          done: false,
        });
      }

      await supabaseAdmin
        .from("subscription_requests")
        .update({
          status: "approved",
          reviewed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", req.id);

      // Log success alert
      await supabaseAdmin.from("security_alerts").insert({
        kind: "auto_activation",
        severity: "info",
        message: `تفعيل تلقائي للعميل ${req.email} بمبلغ ${extracted.amount} ${extracted.currency}`,
        metadata: {
          request_id: req.id,
          amount: extracted.amount,
          currency: extracted.currency,
          reference: extracted.reference,
        },
      });

      return {
        ok: true as const,
        auto_verified: true,
        message: "تم التفعيل التلقائي! تحقق من بريدك لرابط الدخول.",
      };
    } catch (e) {
      // Verified but activation failed → flag for admin
      await supabaseAdmin
        .from("subscription_requests")
        .update({
          verification_status: "needs_review",
          verification_notes:
            "تحقّق ناجح لكن التفعيل التلقائي فشل: " +
            (e instanceof Error ? e.message : "خطأ"),
        })
        .eq("id", req.id);
      return {
        ok: true as const,
        auto_verified: false,
        message: "تم التحقق من الإيصال — سيتم تفعيل حسابك خلال دقائق",
      };
    }
  });

const SignedUrlInput = z.object({
  token: z.string().min(8).max(512),
  path: z.string().min(1).max(500),
});

/**
 * Admin: get signed URL to view a proof image
 */
export const adminGetProofUrl = createServerFn({ method: "POST" })
  .inputValidator((d) => SignedUrlInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const { data: signed, error } = await supabaseAdmin.storage
      .from("payment-proofs")
      .createSignedUrl(data.path, 60 * 10); // 10 min
    if (error || !signed) throw new Error(error?.message || "فشل توليد الرابط");
    return { url: signed.signedUrl };
  });
