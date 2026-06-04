import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  product: z.string().min(3).max(500),
  tone: z.enum(["fun", "luxury", "urgent", "friendly"]).optional().default("friendly"),
});

const TONE_STYLE: Record<string, string> = {
  friendly: "warm, inviting, natural lighting, lifestyle photography",
  fun: "vibrant colors, playful composition, energetic, eye-catching",
  luxury: "elegant, premium, gold accents, soft dramatic lighting, high-end product photography",
  urgent: "bold colors, dynamic composition, sale vibes, attention-grabbing",
};

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch (e) {
          return new Response("Invalid body", { status: 400 });
        }

        const style = TONE_STYLE[parsed.tone];
        const prompt = `Professional social media ad image for: ${parsed.product}.
Style: ${style}.
Square 1:1 composition, clean modern aesthetic, suitable for TikTok/Instagram/Snapchat advertising.
High quality commercial photography, no text overlays, no watermarks, photorealistic.`;

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
          }
        );

        if (!upstream.ok || !upstream.body) {
          const txt = await upstream.text().catch(() => "");
          return new Response(txt || "Upstream error", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
