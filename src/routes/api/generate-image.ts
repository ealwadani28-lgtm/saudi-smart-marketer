import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  product: z.string().min(3).max(500),
  tone: z.enum(["fun", "luxury", "urgent", "friendly"]).optional().default("friendly"),
});

const TONE_STYLE: Record<string, string> = {
  friendly: "warm, inviting, natural lighting, approachable mood",
  fun: "vibrant colors, playful composition, energetic, eye-catching",
  luxury: "elegant, premium, gold/dark accents, soft dramatic lighting, high-end aesthetic",
  urgent: "bold colors, dynamic composition, sale vibes, attention-grabbing",
};

const CLASSIFIER_SYSTEM = `You are a visual ad-direction expert. Given a product description (in Arabic or English), classify it and produce an ENGLISH image-generation prompt tailored to its type.

Categories:
- "website" / "saas": laptop or browser-window mockup. The website's URL/brand name MUST appear in the browser tab and/or as the on-screen logo so viewers know what's being advertised. Surround with modern clean desk setup.
- "mobile_app": smartphone mockup. The app's name/logo MUST appear on the phone screen and/or as a splash. Clean modern background.
- "physical_product": clean studio product photography of the actual item. No text needed.
- "service": lifestyle scene representing the OUTCOME of the service.
- "food": appetizing food photography, top-down or 45deg, natural light.
- "fashion": editorial fashion photo, model or flat-lay.
- "course/education": symbolic learning scene with subject hints.

EXTRACTION:
- Extract the brand name OR domain (e.g. "justlator.com", "Nike", "MyApp") from the product description if present. If you find one, include it explicitly in the prompt as the text that should appear on the browser/phone screen.
- For website/app categories: REQUIRE the brand text on screen. Do NOT add "no text" instructions.
- For other categories: keep "no text overlays, no logos" to avoid garbled words.

CRITICAL:
- Square 1:1, photorealistic, commercial-grade.
- Match the requested tone/style.

Return ONLY valid JSON: {"category": "<cat>", "brand": "<extracted brand or null>", "prompt": "<english image prompt, 3-5 sentences, very specific>"}`;

async function buildSmartPrompt(apiKey: string, product: string, tone: string): Promise<string> {
  const style = TONE_STYLE[tone];
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: CLASSIFIER_SYSTEM },
          { role: "user", content: `Product: ${product}\nTone: ${tone} (${style})` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`classifier ${res.status}`);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsedC = JSON.parse(content) as { category?: string; brand?: string; prompt?: string };
    if (parsedC.prompt && parsedC.prompt.length > 20) {
      return `${parsedC.prompt}\n\nStyle mood: ${style}. Square 1:1 composition, photorealistic, commercial advertising quality.`;
    }
  } catch (e) {
    console.error("smart prompt failed, falling back:", e);
  }
  return `Professional social media ad image for: ${product}.
Style: ${style}.
Square 1:1 composition, clean modern aesthetic.
High quality commercial photography, photorealistic.`;
}

// Allow same-origin (no Origin header), the dev/preview/published Lovable hosts,
// and any registered custom domain via env override.
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // same-origin POST has no Origin header in some browsers; let CORS-less server-side calls through
  try {
    const u = new URL(origin);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".lovable.app") || host.endsWith(".lovable.dev")) return true;
    // Justlator family domains (root + any subdomain)
    if (host === "justlator.com" || host.endsWith(".justlator.com")) return true;
    if (host === "justlator.tech" || host.endsWith(".justlator.tech")) return true;
    const extra = (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (extra.includes(host)) return true;
  } catch {
    return false;
  }
  return false;
}

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const origin = request.headers.get("origin");
        if (!isAllowedOrigin(origin)) {
          return new Response("Forbidden origin", { status: 403, headers: { "X-Robots-Tag": "noindex" } });
        }

        // Per-IP rate limit: 10 / 10 min
        const { rateLimit, getClientIp } = await import("@/lib/rate-limit.server");
        const ip = getClientIp();
        const rl = await rateLimit("gen:image", ip, 10, 600);
        if (!rl.allowed) {
          return new Response(
            JSON.stringify({ error: `طلبات كثيرة — حاول بعد ${Math.ceil(rl.retryAfter / 60)} دقيقة` }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(rl.retryAfter),
                "X-Robots-Tag": "noindex",
              },
            },
          );
        }

        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response("Invalid body", { status: 400, headers: { "X-Robots-Tag": "noindex" } });
        }

        const prompt = await buildSmartPrompt(apiKey, parsed.product, parsed.tone);

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
              stream: true,
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          const txt = await upstream.text().catch(() => "");
          return new Response(txt || "Upstream error", {
            status: upstream.status,
            headers: { "X-Robots-Tag": "noindex" },
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});
