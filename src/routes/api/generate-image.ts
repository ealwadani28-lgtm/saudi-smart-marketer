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

EXTRACTION (CRITICAL — this is the most important step):
- Identify the REAL product/brand name from the description, NOT any platform/preview/hosting URL.
- IGNORE and NEVER use as the brand: any URL containing "lovable.app", "lovable.dev", "vercel.app", "netlify.app", "github.io", "preview--", "id-preview--", "localhost", subdomains like "*--*.lovable.app", or generic dev/staging hosts. These are NOT the product.
- If the description contains BOTH a real brand and a preview URL, use ONLY the real brand. Example: "متجر نون noon.com على preview--xyz.lovable.app" → brand is "noon.com", NOT "lovable.app".
- If NO real brand is found and only a preview/dev URL is present, set brand to null and DO NOT put any URL on the screen — use a generic clean dashboard mockup instead.
- For website/app categories with a valid brand: REQUIRE that exact brand text on screen. Do NOT add "no text" instructions.
- For other categories: keep "no text overlays, no logos" to avoid garbled words.

CRITICAL:
- Square 1:1, photorealistic, commercial-grade.
- Match the requested tone/style.

Return ONLY valid JSON: {"category": "<cat>", "brand": "<extracted real brand or null — NEVER a preview URL>", "prompt": "<english image prompt, 3-5 sentences, very specific>"}`;


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

// Origin allowlist for browser callers. Returns false when no Origin header is
// sent — non-browser clients must instead authenticate via the X-App-Token
// header (see APP_TOKEN). This prevents the previous bypass where omitting
// the Origin header granted access.
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".lovable.app") || host.endsWith(".lovable.dev")) return true;
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

        // Access control: require EITHER a valid Origin (browser call from an
        // allowed host) OR the opaque app token header baked into the client
        // bundle. This blocks anonymous curl/script calls that omit Origin
        // and rely on CORS being a no-op server-side.
        const { APP_TOKEN, APP_TOKEN_HEADER } = await import("@/lib/app-token");
        const origin = request.headers.get("origin");
        const appToken = request.headers.get(APP_TOKEN_HEADER);
        const originOk = isAllowedOrigin(origin);
        const tokenOk = appToken === APP_TOKEN;
        if (!originOk && !tokenOk) {
          return new Response("Forbidden", { status: 403, headers: { "X-Robots-Tag": "noindex" } });
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
