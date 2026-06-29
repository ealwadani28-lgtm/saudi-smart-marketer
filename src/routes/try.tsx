import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, RefreshCw, ArrowLeft, Loader2, Wand2, ImageIcon, Download } from "lucide-react";
import { generatePosts } from "@/lib/generate.functions";
import { streamImage } from "@/lib/streamImage";
import { JustlatorFooter } from "@/components/JustlatorFooter";


export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "جرّب المسوّق الذكي مجاناً — توليد منشورات تسويقية بالذكاء الاصطناعي" },
      { name: "description", content: "أدخل منتجك واحصل على 3 منشورات تسويقية احترافية باللهجة السعودية، جاهزة للنشر فوراً." },
      { property: "og:title", content: "جرّب المسوّق الذكي — MVP تجريبي" },
      { property: "og:description", content: "ولّد 3 منشورات تسويقية في ثوانٍ — مجاناً." },
    ],
  }),
  component: TryPage,
});

type Post = { hook: string; body: string; hashtags: string[] };
type Platform = "tiktok" | "snapchat" | "instagram" | "twitter";
type Tone = "fun" | "luxury" | "urgent" | "friendly";

const PLATFORMS: { id: Platform; label: string; emoji: string }[] = [
  { id: "tiktok", label: "تيك توك", emoji: "🎵" },
  { id: "snapchat", label: "سناب شات", emoji: "👻" },
  { id: "instagram", label: "إنستقرام", emoji: "📸" },
  { id: "twitter", label: "تويتر / X", emoji: "𝕏" },
];

const TONES: { id: Tone; label: string; emoji: string }[] = [
  { id: "friendly", label: "ودّي", emoji: "🤗" },
  { id: "fun", label: "مرح", emoji: "🎉" },
  { id: "luxury", label: "فاخر", emoji: "💎" },
  { id: "urgent", label: "عاجل", emoji: "⚡" },
];

function TryPage() {
  const generate = useServerFn(generatePosts);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [tone, setTone] = useState<Tone>("friendly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgFinal, setImgFinal] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState("");

  async function generateImage() {
    if (!product) return;
    setImgError("");
    setImgLoading(true);
    setImgUrl(null);
    setImgFinal(false);
    try {
      await streamImage("/api/generate-image", { product, tone }, (url, final) => {
        setImgUrl(url);
        if (final) setImgFinal(true);
      });
    } catch (e) {
      setImgError(e instanceof Error ? e.message : "خطأ في توليد الصورة");
    } finally {
      setImgLoading(false);
    }
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPosts([]);
    try {
      const res = await generate({ data: { product, audience, platform, tone } });
      setPosts(res.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }

  async function copyPost(p: Post, idx: number) {
    const text = `${p.body}\n\n${p.hashtags.join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            الرئيسية
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/analyze" className="hidden sm:inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary transition hover:bg-primary/20">
              🔍 حلّل متجرك
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3 w-3" />
              MVP تجريبي
            </span>
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-5xl px-6 py-10 md:py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
            <span className="text-primary">JustMarketing</span> — <span className="text-primary">المسوّق الذكي</span> 🚀
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            أدخل تفاصيل منتجك، وراح نولّد لك <span className="font-bold text-foreground">3 منشورات تسويقية</span> جاهزة للنشر — باللهجة السعودية، في ثوانٍ.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold">المنتج أو الخدمة *</label>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
                minLength={3}
                maxLength={500}
                rows={3}
                placeholder="مثال: عطر نسائي فاخر برائحة الورد والمسك، صناعة سعودية، السعر 199 ريال"
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">الجمهور المستهدف *</label>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                required
                minLength={2}
                maxLength={200}
                placeholder="مثال: نساء 25-40 سنة، يحبون العطور الفاخرة"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">المنصة</label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition ${
                      platform === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <span>{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">نبرة الكتابة</label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition ${
                      tone === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !product || !audience}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري التوليد...
                </>
              ) : posts.length > 0 ? (
                <>
                  <RefreshCw className="h-5 w-5" />
                  ولّد منشورات جديدة
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  ولّد 3 منشورات الآن
                </>
              )}
            </button>
          </div>
        </form>

        <AnimatePresence>
          {posts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10"
            >
              <h2 className="mb-6 text-center font-display text-2xl font-bold md:text-3xl">
                ✨ منشوراتك جاهزة
              </h2>
              <div className="grid gap-5 md:grid-cols-3">
                {posts.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-md transition hover:shadow-lg"
                  >
                    <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      منشور {i + 1}
                    </div>
                    <p className="mb-3 text-base font-bold leading-snug">{p.hook}</p>
                    <p className="mb-4 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {p.hashtags.map((h, j) => (
                        <span key={j} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{h}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => copyPost(p, i)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
                    >
                      {copiedIdx === i ? (
                        <>
                          <Check className="h-4 w-4 text-primary" />
                          تم النسخ
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          نسخ المنشور
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Image generation section */}
              <div className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-md md:p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold md:text-3xl">
                    🎨 تبي صورة إعلانية احترافية؟
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground md:text-base">
                    ولّد صورة إعلانية مربعة جاهزة للنشر — مبنية على وصف منتجك ونبرتك.
                  </p>

                  {!imgUrl && !imgLoading && (
                    <button
                      onClick={generateImage}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:opacity-90"
                    >
                      <Wand2 className="h-5 w-5" />
                      ولّد صورة إعلانية الآن
                    </button>
                  )}

                  {imgLoading && !imgUrl && (
                    <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري بناء الصورة...
                    </div>
                  )}

                  {imgError && (
                    <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                      {imgError}
                    </div>
                  )}

                  {imgUrl && (
                    <div className="mt-6 w-full max-w-md">
                      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
                        <img
                          src={imgUrl}
                          alt="صورة إعلانية مولّدة"
                          loading="lazy"
                          decoding="async"
                          className={`w-full transition-[filter] duration-500 ${imgFinal ? "blur-0" : "blur-2xl"}`}
                        />
                        {!imgFinal && (
                          <div className="absolute inset-0 grid place-items-center bg-background/30 backdrop-blur-sm">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <a
                          href={imgUrl}
                          download="ad-image.png"
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                          <Download className="h-4 w-4" />
                          تحميل الصورة
                        </a>
                        <button
                          onClick={generateImage}
                          disabled={imgLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${imgLoading ? "animate-spin" : ""}`} />
                          ولّد نسخة جديدة
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                عجبتك التجربة؟ <Link to="/" className="font-bold text-primary hover:underline">سجّل في قائمة الأوائل</Link> وكن أول من يستخدم النسخة الكاملة.
              </p>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <JustlatorFooter />
    </div>
  );
}
