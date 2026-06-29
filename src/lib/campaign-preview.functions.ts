import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { validateStoreUrl } from "./url-validator";

const StoreUrlSchema = z
  .string()
  .trim()
  .min(4)
  .max(500)
  .transform((s, ctx) => {
    const r = validateStoreUrl(s);
    if (!r.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.reason });
      return z.NEVER;
    }
    return r.url;
  });

const Input = z.object({ storeUrl: StoreUrlSchema });

export type CampaignPreview = {
  storeTitle: string;
  platform: string;
  posts: Array<{
    platform: "tiktok" | "instagram" | "snapchat" | "twitter";
    hook: string;
    body: string;
    hashtags: string[];
    cta: string;
  }>;
  calendar: Array<{
    day: number;
    platform: string;
    type: string;
    idea: string;
  }>;
  weeklyReportSample: {
    week: number;
    headline: string;
    metrics: Array<{ label: string; value: string; note: string }>;
    notes: string[];
  };
};

const SYSTEM = `أنت "المسوّق الذكي" — تبني معاينة حملة تسويقية ٣٠ يوم لمتجر سعودي/خليجي.
المعاينة هذي تُعرض للعميل قبل ما يدفع، فلازم تكون واقعية وصادقة:
- ٣ منشورات حقيقية جاهزة للنسخ (واحد لكل منصة: TikTok, Instagram, Snapchat).
- جدول ٧ أيام (عينة من الـ ٣٠) فيه اليوم والمنصة ونوع المحتوى وفكرة المنشور.
- تقرير أسبوعي **عينة توضيحية** (لا تكتب أرقام مبيعات وهمية — استخدم خانات "ينتظر البيانات الفعلية" أو نطاقات منطقية للمتجر).

أعِد JSON صحيح فقط بهذا الشكل:
{
  "posts": [
    { "platform": "tiktok", "hook": "...", "body": "...", "hashtags": ["#..."], "cta": "..." },
    { "platform": "instagram", "hook": "...", "body": "...", "hashtags": ["#..."], "cta": "..." },
    { "platform": "snapchat", "hook": "...", "body": "...", "hashtags": ["#..."], "cta": "..." }
  ],
  "calendar": [
    { "day": 1, "platform": "Instagram", "type": "ريلز تعريفي", "idea": "..." }
  ],
  "weeklyReportSample": {
    "week": 1,
    "headline": "...",
    "metrics": [
      { "label": "المشاهدات", "value": "—", "note": "يُعبّأ من بياناتك الفعلية" }
    ],
    "notes": ["ملاحظة 1", "ملاحظة 2"]
  }
}
الجدول لازم يكون ٧ أيام بالضبط. المنشورات ٣ فقط. لهجة سعودية احترافية.`;

export const generateCampaignPreview = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY غير مهيأ");

    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const { fetchStoreHtml, buildSnapshot } = await import("./analyzer.functions");

    const ip = getClientIp();
    const rl = await rateLimit("preview:campaign", ip, 3, 3600);
    if (!rl.allowed) {
      throw new Error(`محاولات كثيرة، حاول بعد ${Math.ceil(rl.retryAfter / 60)} دقيقة`);
    }

    const html = await fetchStoreHtml(data.storeUrl);
    const snapshot = buildSnapshot(html, data.storeUrl);

    const userMsg = `بيانات المتجر:
${JSON.stringify(
  {
    title: snapshot.title,
    description: snapshot.description,
    platform: snapshot.signals.platform,
    products: snapshot.products.slice(0, 8).map((p) => p.name),
    signals: snapshot.signals,
  },
  null,
  2,
)}

ابنِ معاينة الحملة كما طُلب.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[preview] upstream", res.status, txt.slice(0, 300));
      if (res.status === 429) throw new Error("الخدمة مشغولة، جرّب بعد دقيقة.");
      throw new Error("تعذّر توليد المعاينة الآن.");
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Omit<CampaignPreview, "storeTitle" | "platform">;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("رد غير صالح، أعد المحاولة");
    }

    if (!Array.isArray(parsed.posts) || !Array.isArray(parsed.calendar)) {
      throw new Error("المعاينة ناقصة، أعد المحاولة");
    }

    const platformLabel =
      snapshot.signals.platform === "zid"
        ? "زد"
        : snapshot.signals.platform === "salla"
        ? "سلة"
        : snapshot.signals.platform === "shopify"
        ? "Shopify"
        : "أخرى";

    return {
      storeTitle: snapshot.title || data.storeUrl,
      platform: platformLabel,
      ...parsed,
    } satisfies CampaignPreview;
  });
