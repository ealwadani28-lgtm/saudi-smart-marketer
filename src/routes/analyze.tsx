import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowLeft, Loader2, Wand2, Download, Store,
  CheckCircle2, AlertTriangle, Rocket, Target,
} from "lucide-react";
import { analyzeStoreFree, type StoreSnapshot, type StoreReport } from "@/lib/analyzer.functions";
import { validateStoreUrl } from "@/lib/url-validator";
import { printStoreReport } from "@/lib/storeReportPdf";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "حلّل متجرك مجاناً — تقرير ذكي خلال دقيقة" },
      {
        name: "description",
        content:
          "احصل على تقرير تحليل احترافي لمتجرك (زد، سلة، شوبيفاي) مدعوم بالذكاء الاصطناعي — نقاط القوة، الضعف، والتوصيات + PDF جاهز.",
      },
      { property: "og:title", content: "حلّل متجرك مجاناً — المسوّق الذكي" },
      {
        property: "og:description",
        content: "تقرير تحليل متجر مجاني خلال دقيقة، بالذكاء الاصطناعي + PDF.",
      },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const analyze = useServerFn(analyzeStoreFree);
  const [storeUrl, setStoreUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    snapshot: StoreSnapshot;
    report: StoreReport;
    createdAt: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const check = validateStoreUrl(storeUrl);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await analyze({ data: { storeUrl: check.url, email } });
      setResult({ snapshot: res.snapshot, report: res.report, createdAt: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            الرئيسية
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
            <Sparkles className="h-3 w-3" />
            تحليل مجاني
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 md:py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
            حلّل متجرك مجاناً <span className="text-primary">في دقيقة</span> 🔍
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            أدخل رابط متجرك ونرسل لك تقرير تحليل احترافي بالذكاء الاصطناعي — نقاط القوة، الضعف، التوصيات الفورية، و
            <span className="font-bold text-foreground"> PDF جاهز للطباعة</span>.
          </p>
        </div>

        {!result && (
          <form
            onSubmit={onSubmit}
            className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8"
          >
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold">رابط متجرك *</label>
                <input
                  dir="ltr"
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  required
                  placeholder="https://yourstore.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  يدعم متاجر زد، سلة، شوبيفاي، وغيرها.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">بريدك الإلكتروني *</label>
                <input
                  dir="ltr"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  لإرسال نسخة من التقرير + تنبيهات تحسينية لاحقاً.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !storeUrl || !email}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري تحليل متجرك... قد يأخذ دقيقة
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    حلّل متجري الآن
                  </>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                ⚡ متاح 3 تحليلات/ساعة من نفس الجهاز
              </p>
            </div>
          </form>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10"
            >
              <div className="rounded-3xl border border-primary/30 bg-card p-6 shadow-xl md:p-8">
                <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold">{result.snapshot.title || result.snapshot.url}</p>
                      <p className="text-xs text-muted-foreground">
                        منصة: {platformLabel(result.snapshot.signals.platform)} ·{" "}
                        {result.snapshot.products.length} منتج
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      printStoreReport({
                        snapshot: result.snapshot,
                        report: result.report,
                        createdAt: result.createdAt,
                        tier: "free",
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                    تحميل PDF
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <h3 className="mb-1.5 text-sm font-bold text-primary">الخلاصة</h3>
                  <p className="text-sm leading-relaxed md:text-base">{result.report.summary}</p>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <ReportSection
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    title="نقاط القوة"
                    items={result.report.strengths}
                    color="text-success bg-success/5 border-success/20"
                  />
                  <ReportSection
                    icon={<AlertTriangle className="h-5 w-5" />}
                    title="نقاط الضعف"
                    items={result.report.weaknesses}
                    color="text-destructive bg-destructive/5 border-destructive/20"
                  />
                  <ReportSection
                    icon={<Rocket className="h-5 w-5" />}
                    title="فرص فورية"
                    items={result.report.opportunities}
                    color="text-gold bg-gold/5 border-gold/20"
                  />
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                      <Target className="h-5 w-5" />
                      توصيات
                    </h4>
                    <div className="space-y-2">
                      {result.report.recommendations.slice(0, 4).map((r, i) => (
                        <div key={i} className="rounded-lg bg-background/80 p-2.5">
                          <p className="text-sm font-bold">{r.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{r.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground">
                  <h3 className="font-display text-xl font-bold">تبي تشوف حملتك قبل ما تدفع؟ 👀</h3>
                  <p className="mt-2 text-sm opacity-95">
                    معاينة مجانية: ٣ منشورات جاهزة + جدول نشر أسبوع + نموذج تقرير أسبوعي — بنفس بيانات متجرك.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to="/preview"
                      search={{ url: result.snapshot.url }}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:opacity-90"
                    >
                      شوف معاينة الحملة
                    </Link>
                    <Link
                      to="/subscribe"
                      className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold backdrop-blur hover:bg-white/25"
                    >
                      اشترك الآن
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setResult(null);
                    setStoreUrl("");
                  }}
                  className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                >
                  حلّل متجر آخر
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <JustlatorFooter />
    </div>
  );
}

function ReportSection({
  icon, title, items, color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}) {
  if (!items?.length) {
    return (
      <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
        لا توجد {title} مرصودة
      </div>
    );
  }
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((it, i) => (
          <li key={i} className="rounded-lg bg-background/60 px-3 py-2 text-xs leading-relaxed text-foreground">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function platformLabel(p: StoreSnapshot["signals"]["platform"]): string {
  return p === "zid" ? "زد" : p === "salla" ? "سلة" : p === "shopify" ? "Shopify" : "أخرى";
}
