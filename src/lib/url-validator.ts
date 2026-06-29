// Pre-flight validator: ensure a URL plausibly points to a real public store/site
// before we spend tokens analyzing it.

const BLOCKED_HOST_SUFFIXES = [
  // Lovable preview/published shells (use the user's real domain instead)
  "lovable.app",
  "lovableproject.com",
  "lovable.dev",
  // Generic dev/preview hosts that are usually not the merchant's real storefront
  "vercel.app",
  "netlify.app",
  "pages.dev",
  "github.io",
  "repl.co",
  "ngrok.io",
  "ngrok-free.app",
  // Local
  "localhost",
  ".local",
];

const BLOCKED_HOSTS_EXACT = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

// Platforms/aggregators — not a single merchant storefront we can analyze.
const BLOCKED_PLATFORM_HOSTS = [
  "facebook.com",
  "m.facebook.com",
  "instagram.com",
  "tiktok.com",
  "snapchat.com",
  "x.com",
  "twitter.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "pinterest.com",
  "google.com",
  "google.sa",
  "wikipedia.org",
  "amazon.sa",
  "amazon.com",
  "noon.com",
  "aliexpress.com",
];

// URL shorteners — we can't analyze without following, and they often hide spam.
const SHORTENERS = new Set([
  "bit.ly",
  "t.co",
  "lnkd.in",
  "goo.gl",
  "tinyurl.com",
  "ow.ly",
  "buff.ly",
  "rb.gy",
  "is.gd",
  "shorturl.at",
]);

function isIpLiteral(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true; // IPv4
  if (host.includes(":") && /^[0-9a-f:]+$/i.test(host)) return true; // IPv6-ish
  return false;
}

function stripWww(host: string): string {
  return host.replace(/^www\./i, "");
}

export function validateStoreUrl(input: string): { ok: true; url: string } | { ok: false; reason: string } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: "أدخل رابط متجرك." };

  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let u: URL;
  try {
    u = new URL(withProto);
  } catch {
    return { ok: false, reason: "صيغة الرابط غير صحيحة. مثال صحيح: yourstore.com" };
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "الرابط لازم يبدأ بـ http أو https." };
  }

  const host = stripWww(u.hostname.toLowerCase());

  if (!host || host.length < 4 || !host.includes(".")) {
    return { ok: false, reason: "الدومين غير مكتمل. تأكد من إضافة الامتداد مثل .com أو .sa" };
  }

  if (BLOCKED_HOSTS_EXACT.has(host) || isIpLiteral(host)) {
    return { ok: false, reason: "هذا الرابط محلي/IP وليس دومين عام. استخدم رابط متجرك المنشور." };
  }

  for (const suffix of BLOCKED_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix.replace(/^\./, "")}`) || host.endsWith(suffix)) {
      // Lovable preview is the most common confusion → رسالة واضحة
      if (suffix.includes("lovable")) {
        return {
          ok: false,
          reason:
            "هذا رابط معاينة لا يمثل متجرك الحقيقي. استخدم دومين متجرك الفعلي (مثل yourstore.com أو yourstore.sa).",
        };
      }
      return {
        ok: false,
        reason: `الدومين (${host}) دومين معاينة/استضافة مؤقتة، استخدم دومين متجرك الرسمي.`,
      };
    }
  }

  // Lovable preview pattern: id-preview--<id>.lovable.app (already caught) +
  // any sandbox-style "<hex>--<hex>" subdomain → block as preview.
  if (/^[a-z0-9-]+--[a-z0-9-]+\./i.test(host)) {
    return {
      ok: false,
      reason: "هذا رابط معاينة مؤقت. استخدم دومين متجرك الرسمي.",
    };
  }

  if (SHORTENERS.has(host)) {
    return {
      ok: false,
      reason: "روابط الاختصار غير مدعومة. الصق رابط متجرك الكامل.",
    };
  }

  for (const p of BLOCKED_PLATFORM_HOSTS) {
    if (host === p || host.endsWith(`.${p}`)) {
      return {
        ok: false,
        reason:
          "هذا رابط منصة/سوق عام وليس متجراً مستقلاً. ندعم تحليل متجرك الخاص (سلة، زد، Shopify، WooCommerce، أو موقعك).",
      };
    }
  }

  // Normalize: drop hash and trailing slash; keep path/query.
  u.hash = "";
  const normalized = u.toString().replace(/\/$/, "");
  return { ok: true, url: normalized };
}
