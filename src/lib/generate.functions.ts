import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  product: z.string().min(3).max(500),
  audience: z.string().min(2).max(200),
  platform: z.enum(["tiktok", "snapchat", "instagram", "twitter"]),
  tone: z.enum(["fun", "luxury", "urgent", "friendly"]),
});

const SYSTEM = `أنت "المسوّق الذكي" — كاتب محتوى تسويقي محترف متخصص في السوق السعودي والخليجي.
- تكتب باللهجة السعودية الحديثة (مفهومة لكل الخليج) — طبيعية، ما تكون مصطنعة.
- تركز على hook قوي في أول جملة، ثم قيمة واضحة، ثم CTA.
- تتجنب المبالغات الكاذبة و"مضمون 100%".
- تستخدم الإيموجي بذكاء (مش حشو).
- كل منشور قصير ومناسب للمنصة المطلوبة.

أعِد الناتج بصيغة JSON صحيحة فقط، بدون أي شرح أو نص خارج JSON:
{
  "posts": [
    { "hook": "الجملة الأولى الجذابة", "body": "نص المنشور كامل جاهز للنشر", "hashtags": ["#وسم1", "#وسم2", "#وسم3"] },
    { "hook": "...", "body": "...", "hashtags": ["..."] },
    { "hook": "...", "body": "...", "hashtags": ["..."] }
  ]
}`;

export const generatePosts = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY غير مهيأ");

    // Per-IP rate limit: 10 requests / 10 min
    const { rateLimit, getClientIp } = await import("./rate-limit.server");
    const ip = getClientIp();
    const rl = await rateLimit("gen:posts", ip, 10, 600);
    if (!rl.allowed) {
      throw new Error(`طلبات كثيرة — حاول بعد ${Math.ceil(rl.retryAfter / 60)} دقيقة`);
    }

    const userMsg = `المنتج/الخدمة: ${data.product}
الجمهور المستهدف: ${data.audience}
المنصة: ${data.platform}
النبرة: ${data.tone}

اكتب لي 3 منشورات تسويقية مختلفة الزاوية، جاهزة للنشر فوراً.`;

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
      console.error("[generate] upstream error", res.status, txt.slice(0, 500));
      if (res.status === 429) throw new Error("طلبات كثيرة الآن — جرّب بعد دقيقة من فضلك.");
      if (res.status === 402) throw new Error("الخدمة مشغولة حالياً، تواصل معنا عبر واتساب.");
      throw new Error("تعذّر توليد المنشورات الآن، حاول مرة أخرى بعد قليل.");
    }


    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { posts: Array<{ hook: string; body: string; hashtags: string[] }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("الرد غير صالح — أعد المحاولة");
    }
    if (!Array.isArray(parsed.posts) || parsed.posts.length === 0) {
      throw new Error("لم يتم توليد منشورات — أعد المحاولة");
    }
    return { posts: parsed.posts.slice(0, 3) };
  });
