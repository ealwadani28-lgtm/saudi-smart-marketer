import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  Eye,
  Instagram,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wand2,
  TrendingUp,
} from "lucide-react";
import { z } from "zod";
import { generateCampaignPreview, type CampaignPreview } from "@/lib/campaign-preview.functions";
import { validateStoreUrl } from "@/lib/url-validator";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/preview")({
  validateSearch: z.object({ url: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "معاينة الحملة قبل الدفع — المسوّق الذكي" },
      {
        name: "description",
        content:
          "شوف عينة من حملتك التسويقية ٣٠ يوم قبل ما تدفع — ٣ منشورات جاهزة + جدول نشر + نموذج تقرير أسبوعي.",
      },
      { property: "og:title", content: "معاينة الحملة قبل الدفع — المسوّق الذكي" },
    ],
  }),
  component: PreviewPage,
});

function PreviewPage() {
  const { url } = useSearch({ from: "/preview" });
  const run = useServerFn(generateCampaignPreview);
  const [storeUrl, setStoreUrl] = useState(url ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<CampaignPreview | null>(null);

  async function go(u: string) {
    setError("");
    setData(null);
    setLoading(true);
    try {
      const r = await run({ data: { storeUrl: u } });
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  // auto-run when ?url= passed
  useEffect(() => {
    if (url && !data && !loading) {
      void go(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            الرئيسية
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
            <Eye className="h-3 w-3" />
            معاينة الحملة
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
            شوف حملتك <span className="text-primary">قبل ما تدفع</span> 👀
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            عينة حقيقية من الـ ٣٠ منشور اللي بنبنيها لك: ٣ منشورات جاهزة + جدول نشر أسبوع + نموذج تقرير أسبوعي.
          </p>
        </div>

        {!data && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (storeUrl) void go(storeUrl);
            }}
            className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8"
          >
            <label className="mb-2 block text-sm font-bold">رابط متجرك</label>
            <input
              dir="ltr"
              type="url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              required
              placeholder="https://yourstore.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            {error && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !storeUrl}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري بناء معاينة حملتك...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  ابنِ المعاينة
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              ⚡ ٣ معاينات/ساعة من نفس الجهاز · مجاناً
            </p>
          </form>
        )}

        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 space-y-8"
          >
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <p className="text-sm text-muted-foreground">المتجر</p>
              <p className="mt-1 text-lg font-bold">{data.storeTitle}</p>
              <p className="text-xs text-muted-foreground">منصة: {data.platform}</p>
            </div>

            {/* SECTION 1: Sample Posts */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <Sparkles className="h-5 w-5 text-primary" />
                ١. عينة من المنشورات الجاهزة
                <span className="text-xs font-normal text-muted-foreground">
                  (٣ من ٣٠ منشور بالخطة الكاملة)
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {data.posts.map((p, i) => (
                  <PostCard key={i} post={p} />
                ))}
              </div>
            </section>

            {/* SECTION 2: Calendar */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <Calendar className="h-5 w-5 text-primary" />
                ٢. جدول النشر — عيّنة ٧ أيام
                <span className="text-xs font-normal text-muted-foreground">(من أصل ٣٠)</span>
              </h2>
              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-right">اليوم</th>
                      <th className="px-4 py-3 text-right">المنصة</th>
                      <th className="px-4 py-3 text-right">نوع المحتوى</th>
                      <th className="px-4 py-3 text-right">الفكرة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.calendar.slice(0, 7).map((c, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-4 py-3 font-bold text-primary">يوم {c.day}</td>
                        <td className="px-4 py-3">{c.platform}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.type}</td>
                        <td className="px-4 py-3">{c.idea}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 3: Weekly Report Sample */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <TrendingUp className="h-5 w-5 text-primary" />
                ٣. نموذج التقرير الأسبوعي
              </h2>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">الأسبوع {data.weeklyReportSample.week}</p>
                <p className="mt-1 text-lg font-bold">{data.weeklyReportSample.headline}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {data.weeklyReportSample.metrics.map((m, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="mt-1 text-2xl font-bold text-primary">{m.value}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{m.note}</p>
                    </div>
                  ))}
                </div>
                <ul className="mt-5 space-y-2 text-sm">
                  {data.weeklyReportSample.notes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  💡 الأرقام الحقيقية تُعبّأ من بيانات Meta/Google/منصات التواصل بعد بدء الاشتراك.
                </p>
              </div>
            </section>

            {/* CTA */}
            <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-8 text-primary-foreground">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="font-display text-2xl font-bold">عجبتك المعاينة؟</h3>
                  <p className="mt-2 max-w-xl text-sm opacity-95">
                    الخطة الكاملة: ٣٠ منشور + تحليل منافسين + خطة محتوى شهرية + تقارير أسبوعية مع KPIs مؤمّنة بـ
                    SHA-256.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs opacity-90">
                    <ShieldCheck className="h-4 w-4" />
                    بدون عقود · ادفع شهرياً · ١٬٥٠٠ ريال
                  </div>
                </div>
                <Link
                  to="/subscribe"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary transition hover:opacity-90"
                >
                  اشترك الآن
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setData(null);
                  setStoreUrl("");
                }}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                جرّب معاينة متجر آخر
              </button>
            </div>
          </motion.div>
        )}
      </main>
      <JustlatorFooter />
    </div>
  );
}

function PostCard({ post }: { post: CampaignPreview["posts"][number] }) {
  const [copied, setCopied] = useState(false);
  const text = `${post.hook}\n\n${post.body}\n\n${post.hashtags.join(" ")}\n\n${post.cta}`;
  const label =
    post.platform === "tiktok"
      ? "TikTok"
      : post.platform === "instagram"
      ? "Instagram"
      : post.platform === "snapchat"
      ? "Snapchat"
      : "Twitter/X";

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          <Instagram className="h-3 w-3" />
          {label}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
        >
          {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "تم النسخ" : "نسخ"}
        </button>
      </div>
      <p className="text-sm font-bold leading-relaxed">{post.hook}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{post.body}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {post.hashtags.map((h, i) => (
          <span key={i} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
            {h}
          </span>
        ))}
      </div>
      <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs font-bold text-primary">{post.cta}</p>
    </div>
  );
}
