import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Share2, MessageCircle, Twitter, Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "شكراً لتسجيلك — المسوق الذكي" },
      { name: "description", content: "تم تسجيلك بنجاح في قائمة المهتمين الأوائل بمنصة المسوق الذكي." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "شكراً لتسجيلك — المسوق الذكي" },
      { property: "og:description", content: "تم تسجيلك بنجاح في قائمة المهتمين الأوائل." },
    ],
  }),
  component: ThankYouPage,
});

const SHARE_URL = "https://almusawiq.com";
const SHARE_TEXT = "اكتشفت منصة المسوق الذكي 🚀 — أول منصة ذكاء اصطناعي للتسويق متخصصة في المتاجر السعودية. سجّل قبل الإطلاق:";

function ThankYouPage() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center md:py-24">
        <div className="relative">
          <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/20 blur-3xl" />
          <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-2xl">
            <CheckCircle2 className="h-14 w-14 text-primary-foreground" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="mt-8 font-display text-3xl font-bold leading-tight md:text-5xl">
          مبروك! أنت من الأوائل 🎉
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
          تم تسجيلك بنجاح في قائمة المهتمين. راح نرسلك تحديثات حصرية + خصم خاص للمؤسسين عند الإطلاق.
        </p>

        <div className="mt-10 grid w-full gap-4 rounded-3xl border border-border bg-card p-6 text-right md:p-8">
          <h2 className="font-display text-xl font-bold">الخطوات التالية:</h2>
          <ul className="space-y-3 text-sm md:text-base">
            <li className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold">١</span>
              <span>تحقق من بريدك الإلكتروني خلال الـ 24 ساعة القادمة لتأكيد التسجيل.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold">٢</span>
              <span>راح نرسلك تحليل مجاني لمتجرك خلال أسبوع.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold">٣</span>
              <span>عند الإطلاق، راح تحصل على خصم 30% كعرض المؤسسين.</span>
            </li>
          </ul>
        </div>

        <div className="mt-10 w-full">
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Share2 className="h-4 w-4" />
            <span>ساعدنا بمشاركة المنصة مع صاحب متجر تعرفه</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + " " + SHARE_URL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary/5"
            >
              <MessageCircle className="h-4 w-4" />
              واتساب
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary/5"
            >
              <Twitter className="h-4 w-4" />
              تويتر / X
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent("منصة المسوق الذكي")}&body=${encodeURIComponent(SHARE_TEXT + "\n\n" + SHARE_URL)}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary/5"
            >
              <Mail className="h-4 w-4" />
              بريد
            </a>
            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary/5"
            >
              <Share2 className="h-4 w-4" />
              {copied ? "تم النسخ ✓" : "نسخ الرابط"}
            </button>
          </div>
        </div>

        <Link
          to="/"
          className="mt-12 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة للرئيسية
        </Link>
      </main>
      <JustlatorFooter />
    </div>
  );
}
