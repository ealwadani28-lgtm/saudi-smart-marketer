import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ============= Schemas =============

const StoreUrlSchema = z
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
  }, "رابط غير صالح");

const FreeAnalyzeInput = z.object({
  storeUrl: StoreUrlSchema,
  email: z.string().trim().email().max(255),
});

const PaidAnalyzeInput = z.object({
  userId: z.string().uuid(),
  storeUrl: StoreUrlSchema,
});

const ListInput = z.object({
  userId: z.string().uuid(),
});

// ============= Types =============

export type StoreSnapshot = {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  language: string | null;
  products: Array<{ name: string; price: string | null; image: string | null }>;
  socialLinks: Record<string, string>;
  whatsapp: string | null;
  signals: {
    hasInstagram: boolean;
    hasTiktok: boolean;
    hasSnapchat: boolean;
    hasTwitter: boolean;
    hasWhatsApp: boolean;
    hasReviews: boolean;
    hasOffers: boolean;
    platform: "zid" | "salla" | "shopify" | "other";
  };
  textSample: string;
};

export type StoreReport = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: Array<{ title: string; detail: string; priority: "high" | "medium" | "low" }>;
  competitors?: Array<{ name: string; note: string }>;
  contentPlan?: Array<{ day: number; platform: string; idea: string }>;
};

// ============= HTML Parsing =============

function pickMeta(html: string, names: string[]): string {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2) return decodeEntities(m2[1]);
  }
  return "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function detectPlatform(html: string): StoreSnapshot["signals"]["platform"] {
  const h = html.toLowerCase();
  if (h.includes("zid.sa") || h.includes("cdn.zid.store") || h.includes('"zid"')) return "zid";
  if (h.includes("salla.sa") || h.includes("cdn.salla") || h.includes("salla.network")) return "salla";
  if (h.includes("cdn.shopify.com") || h.includes("shopify")) return "shopify";
  return "other";
}

function extractProducts(html: string, baseUrl: string): StoreSnapshot["products"] {
  const products: StoreSnapshot["products"] = [];
  const seen = new Set<string>();

  // Try JSON-LD Product schema first
  const ldMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldMatches) {
    try {
      const data = JSON.parse(m[1].trim());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const nodes = item["@graph"] ?? [item];
        for (const n of nodes) {
          if (n["@type"] === "Product" && n.name) {
            const key = String(n.name).trim();
            if (seen.has(key)) continue;
            seen.add(key);
            products.push({
              name: key,
              price: n.offers?.price ? String(n.offers.price) : null,
              image: typeof n.image === "string" ? n.image : Array.isArray(n.image) ? n.image[0] : null,
            });
          }
        }
      }
    } catch { /* ignore */ }
    if (products.length >= 20) break;
  }

  // Fallback: anchor tags pointing to /products/
  if (products.length < 3) {
    const re = /<a[^>]+href=["']([^"']*\/products?\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && products.length < 20) {
      const href = m[1];
      const text = stripTags(m[2]).slice(0, 80);
      if (!text || text.length < 3 || seen.has(text)) continue;
      seen.add(text);
      try {
        const abs = new URL(href, baseUrl).toString();
        products.push({ name: text, price: null, image: abs });
      } catch { /* ignore */ }
    }
  }

  return products.slice(0, 15);
}

function extractSocialLinks(html: string): { social: Record<string, string>; whatsapp: string | null } {
  const social: Record<string, string> = {};
  const platforms: Array<[string, RegExp]> = [
    ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/i],
    ["tiktok", /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+/i],
    ["snapchat", /https?:\/\/(?:www\.)?snapchat\.com\/add\/[a-zA-Z0-9_.-]+/i],
    ["twitter", /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/i],
    ["youtube", /https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/)[a-zA-Z0-9_-]+/i],
  ];
  for (const [k, re] of platforms) {
    const m = html.match(re);
    if (m) social[k] = m[0];
  }
  let whatsapp: string | null = null;
  const wa =
    html.match(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^"'\s<]+/i) ||
    html.match(/whatsapp:\/\/send\?phone=(\d+)/i);
  if (wa) whatsapp = wa[0];
  return { social, whatsapp };
}

export async function fetchStoreHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JustMarketingBot/1.0; +https://justmarketing.sa)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ar,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`المتجر رجّع حالة ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html")) throw new Error("الرابط لا يشير إلى صفحة HTML");
    const text = await res.text();
    if (text.length < 500) throw new Error("محتوى المتجر فارغ أو محمي");
    // Cap at 600KB to keep tokens reasonable
    return text.slice(0, 600_000);
  } finally {
    clearTimeout(timer);
  }
}

export function buildSnapshot(html: string, url: string): StoreSnapshot {
  const title =
    pickMeta(html, ["og:title", "twitter:title"]) ||
    (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "").trim();
  const description = pickMeta(html, ["og:description", "twitter:description", "description"]);
  const ogImage = pickMeta(html, ["og:image", "twitter:image"]) || null;
  const language =
    html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? null;

  const products = extractProducts(html, url);
  const { social, whatsapp } = extractSocialLinks(html);
  const platform = detectPlatform(html);

  const lowerHtml = html.toLowerCase();
  const signals: StoreSnapshot["signals"] = {
    hasInstagram: !!social.instagram,
    hasTiktok: !!social.tiktok,
    hasSnapchat: !!social.snapchat,
    hasTwitter: !!social.twitter,
    hasWhatsApp: !!whatsapp,
    hasReviews: /\b(review|rating|تقييم|تقييمات|نجمة)\b/i.test(lowerHtml),
    hasOffers: /\b(offer|sale|discount|عرض|تخفيض|خصم|كوبون)\b/i.test(lowerHtml),
    platform,
  };

  const textSample = stripTags(html).slice(0, 4000);

  return {
    url,
    title: decodeEntities(title).slice(0, 200),
    description: description.slice(0, 500),
    ogImage,
    language,
    products,
    socialLinks: social,
    whatsapp,
    signals,
    textSample,
  };
}

// ============= Gemini Analysis =============

const SYSTEM_FREE = `أنت محلل تسويق رقمي خبير في السوق السعودي والخليجي.
حلّل بيانات المتجر بصدق ووضوح، باللهجة السعودية الاحترافية.
ركّز على: نقاط قوة فعلية، نقاط ضعف يمكن إصلاحها، فرص فورية، وتوصيات عملية.
لا تخترع بيانات لم تأت في snapshot. كن صريحاً ومحدداً.

أعِد JSON فقط بهذا الشكل:
{
  "summary": "ملخص حالة المتجر في جملتين",
  "strengths": ["نقطة قوة 1", "..."],
  "weaknesses": ["نقطة ضعف 1", "..."],
  "opportunities": ["فرصة 1", "..."],
  "recommendations": [
    { "title": "عنوان", "detail": "خطوات عملية", "priority": "high|medium|low" }
  ]
}`;

const SYSTEM_PAID = `أنت محلل تسويق رقمي خبير في السوق السعودي والخليجي.
حلّل بيانات المتجر بصدق وعمق، باللهجة السعودية الاحترافية.
هذا تقرير مدفوع — كن أعمق وأكثر تفصيلاً. قارن بأفضل ممارسات السوق السعودي.
لا تخترع بيانات لم تأت في snapshot. كن صريحاً ومحدداً.

أعِد JSON فقط بهذا الشكل:
{
  "summary": "ملخص حالة المتجر في 2-3 جمل",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recommendations": [
    { "title": "...", "detail": "خطوات عملية محددة", "priority": "high|medium|low" }
  ],
  "competitors": [
    { "name": "اسم منافس محتمل في السوق السعودي", "note": "ماذا يفعل أفضل" }
  ],
  "contentPlan": [
    { "day": 1, "platform": "instagram|tiktok|snapchat|twitter", "idea": "فكرة منشور" }
  ]
}
أعطِ خطة محتوى 30 يوماً (30 عنصر). و 3-5 منافسين.`;

async function callGemini(snapshot: StoreSnapshot, tier: "free" | "paid"): Promise<StoreReport> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY غير مهيأ");

  const userMsg = `بيانات المتجر:
${JSON.stringify(
  {
    url: snapshot.url,
    title: snapshot.title,
    description: snapshot.description,
    platform: snapshot.signals.platform,
    products: snapshot.products.slice(0, 10),
    socialLinks: snapshot.socialLinks,
    whatsapp: snapshot.whatsapp,
    signals: snapshot.signals,
    sampleText: snapshot.textSample.slice(0, 2000),
  },
  null,
  2,
)}

حلّل المتجر وأعِد JSON كما طُلب.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: tier === "paid" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: tier === "paid" ? SYSTEM_PAID : SYSTEM_FREE },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[analyzer] upstream error", res.status, txt.slice(0, 500));
    if (res.status === 429) throw new Error("الخدمة مشغولة الآن — جرّب بعد دقيقة.");
    if (res.status === 402) throw new Error("الخدمة مشغولة حالياً، تواصل معنا عبر واتساب.");
    throw new Error("تعذّر تحليل المتجر الآن، أعد المحاولة بعد قليل.");
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: StoreReport;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("رد الذكاء غير صالح، أعد المحاولة");
  }
  if (!parsed.summary || !Array.isArray(parsed.recommendations)) {
    throw new Error("التحليل ناقص، أعد المحاولة");
  }
  return parsed;
}

// ============= Free analysis (public /try) =============

export const analyzeStoreFree = createServerFn({ method: "POST" })
  .inputValidator((d) => FreeAnalyzeInput.parse(d))
  .handler(async ({ data }) => {
    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip = getClientIp();
    const rl = await rateLimit("analyze:free", ip, 3, 3600);
    if (!rl.allowed) {
      throw new Error(`محاولات كثيرة، حاول بعد ${Math.ceil(rl.retryAfter / 60)} دقيقة`);
    }

    const html = await fetchStoreHtml(data.storeUrl);
    const snapshot = buildSnapshot(html, data.storeUrl);
    const report = await callGemini(snapshot, "free");

    const { data: row, error } = await supabaseAdmin
      .from("store_analyses")
      .insert({
        email: data.email,
        store_url: data.storeUrl,
        tier: "free",
        snapshot,
        report,
        next_refresh_at: null,
      })
      .select("id")
      .single();
    if (error) console.error("[analyzer] save error", error.message);

    return { id: row?.id ?? null, snapshot, report };
  });

// ============= Paid analysis (workspace) =============

export const analyzeStorePaid = createServerFn({ method: "POST" })
  .inputValidator((d) => PaidAnalyzeInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify customer exists & subscription active
    const { data: customer, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id, status, subscription_end")
      .eq("user_id", data.userId)
      .single();
    if (cErr || !customer) throw new Error("لم نجد مساحة عملك");
    if (customer.status !== "active") throw new Error("اشتراكك غير مفعّل");

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

    // Save the shop_url on the customer if missing
    await supabaseAdmin
      .from("customers")
      .update({ shop_url: data.storeUrl, shop_name: snapshot.title || null })
      .eq("id", customer.id);

    // Add to updates feed
    await supabaseAdmin.from("customer_updates").insert({
      customer_id: customer.id,
      type: "analysis",
      title: `تحليل متجرك جاهز — ${snapshot.title || data.storeUrl}`,
      body: report.summary,
      done: true,
    });

    return { id: row?.id, snapshot, report, createdAt: row?.created_at };
  });

// ============= List analyses (workspace) =============

export const listStoreAnalyses = createServerFn({ method: "POST" })
  .inputValidator((d) => ListInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", data.userId)
      .single();
    if (!customer) return { analyses: [] };

    const { data: rows } = await supabaseAdmin
      .from("store_analyses")
      .select("id, store_url, snapshot, report, created_at, next_refresh_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return { analyses: rows ?? [] };
  });
