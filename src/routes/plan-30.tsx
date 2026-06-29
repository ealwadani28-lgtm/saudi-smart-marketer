import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Calendar, Sparkles, Megaphone, Camera, ShoppingBag, Star, Gift, Video, Newspaper } from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/plan-30")({
  head: () => ({
    meta: [
      { title: "خطة 30 يوم — نموذج تقويم محتوى | المسوق الذكي" },
      {
        name: "description",
        content:
          "شاهد كيف تبدو خطة 30 يوم حقيقية: تقويم نشر يومي بأنواع محتوى متنوعة (منتج، عرض، قصة، مراجعة) مخصص للمتاجر السعودية.",
      },
      { property: "og:title", content: "نموذج خطة 30 يوم — المسوق الذكي" },
      { property: "og:description", content: "تقويم محتوى يومي لمتجرك الإلكتروني — مثال مجاني قابل للتخصيص." },
    ],
    links: [{ rel: "canonical", href: "/plan-30" }],
  }),
  component: Plan30Page,
});

type PostType = "product" | "offer" | "story" | "review" | "reel" | "news" | "ugc" | "gift";

const TYPE_META: Record<PostType, { label: string; color: string; icon: any }> = {
  product: { label: "منتج", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: ShoppingBag },
  offer:   { label: "عرض", color: "bg-rose-500/15 text-rose-600 border-rose-500/30", icon: Megaphone },
  story:   { label: "قصة", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: Newspaper },
  review:  { label: "مراجعة", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: Star },
  reel:    { label: "ريل", color: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: Video },
  news:    { label: "خبر", color: "bg-sky-500/15 text-sky-600 border-sky-500/30", icon: Newspaper },
  ugc:     { label: "محتوى عميل", color: "bg-teal-500/15 text-teal-600 border-teal-500/30", icon: Camera },
  gift:    { label: "هدية / مسابقة", color: "bg-pink-500/15 text-pink-600 border-pink-500/30", icon: Gift },
};

type Channel = "instagram" | "tiktok" | "snapchat" | "x" | "whatsapp";
const CHANNEL_LABEL: Record<Channel, string> = {
  instagram: "إنستقرام",
  tiktok: "تيك توك",
  snapchat: "سناب شات",
  x: "إكس",
  whatsapp: "واتساب",
};

type Day = { day: number; type: PostType; title: string; brief: string; channels: Channel[]; cta: string };

const SAMPLE_PLAN: Day[] = [
  { day: 1, type: "story",   title: "قصة العلامة التجارية", brief: "ليش بدأت متجرك؟ القصة الإنسانية ورا المنتج (نص + صورة شخصية).", channels: ["instagram","x"], cta: "تعرف علينا أكثر" },
  { day: 2, type: "product", title: "إطلاق منتج الشهر", brief: "ركز على فائدة واحدة محددة + 3 صور احترافية + سعر واضح.", channels: ["instagram","tiktok"], cta: "اطلب الآن" },
  { day: 3, type: "review",  title: "رأي عميل سابق", brief: "اقتباس عميل + سكرين شوت محادثة (بإذنه) + رابط المنتج.", channels: ["instagram","snapchat"], cta: "جرّب بنفسك" },
  { day: 4, type: "reel",    title: "ريل قصير — استخدام المنتج", brief: "فيديو 15-30 ثانية يوريك المنتج وهو يُستخدم في موقف يومي.", channels: ["instagram","tiktok"], cta: "شوف العرض" },
  { day: 5, type: "offer",   title: "عرض خميس-جمعة", brief: "خصم 15% بكود محدد لمدة 48 ساعة فقط. عداد تنازلي في الستوري.", channels: ["instagram","snapchat","whatsapp"], cta: "استخدم الكود" },
  { day: 6, type: "ugc",     title: "إعادة نشر صورة عميل", brief: "صورة عميل حقيقي بالمنتج + شكر + رابط الفئة.", channels: ["instagram"], cta: "شاركنا تجربتك" },
  { day: 7, type: "news",    title: "خبر / تحديث", brief: "إعلان عن منتج قادم أو شراكة أو شحن مجاني جديد.", channels: ["x","whatsapp"], cta: "تابع الجديد" },
  { day: 8, type: "product", title: "Bundle (حزمة موفّرة)", brief: "اعرض 2-3 منتجات مع بعض بسعر أقل من إجمالي مفردها.", channels: ["instagram","tiktok"], cta: "وفّر الآن" },
  { day: 9, type: "story",   title: "وراء الكواليس", brief: "صور أو فيديو من التغليف، المستودع، أو فريق العمل.", channels: ["instagram","snapchat"], cta: "تعرف على فريقنا" },
  { day:10, type: "review",  title: "Before / After", brief: "مقارنة بصرية لنتيجة استخدام المنتج (إن كان مناسباً).", channels: ["instagram","tiktok"], cta: "احصل على النتيجة" },
  { day:11, type: "reel",    title: "5 أسباب تجرب منتجنا", brief: "ريل سريع بقالب نصي + موسيقى ترند.", channels: ["instagram","tiktok"], cta: "اكتشف المزيد" },
  { day:12, type: "offer",   title: "شحن مجاني عند 199 ر.س", brief: "إعلان واضح + بانر + تذكير في الستوري على مدار اليوم.", channels: ["instagram","x"], cta: "تسوّق الآن" },
  { day:13, type: "ugc",     title: "تحدي / هاشتاق", brief: "ادعُ المتابعين لمشاركة صورهم مع المنتج بهاشتاق خاص.", channels: ["instagram","tiktok"], cta: "شارك بهاشتاقنا" },
  { day:14, type: "news",    title: "تحديث المخزون", brief: "ذكّر بمنتجات نفدت ورجعت، أو وصول قطع محدودة.", channels: ["instagram","whatsapp"], cta: "احجز قبل النفاد" },
  { day:15, type: "gift",    title: "مسابقة منتصف الشهر", brief: "اربح منتج مجاني بشرط: متابعة + إعادة نشر + وسم 3 أصدقاء.", channels: ["instagram","snapchat"], cta: "شارك بالمسابقة" },
  { day:16, type: "product", title: "منتج جديد", brief: "ركّز على الميزة الأبرز + سعر إطلاق محدود.", channels: ["instagram","tiktok"], cta: "كن أول من يجرب" },
  { day:17, type: "review",  title: "تجميعة آراء عملاء", brief: "كاروسيل من 5-7 آراء حقيقية بتصميم موحّد.", channels: ["instagram"], cta: "اقرأ آراء العملاء" },
  { day:18, type: "reel",    title: "ريل تعليمي", brief: "اشرح طريقة استخدام أو فائدة غير معروفة بشكل سريع وممتع.", channels: ["instagram","tiktok"], cta: "تعلّم أكثر" },
  { day:19, type: "story",   title: "Q&A مفتوح", brief: "افتح بوكس أسئلة في الستوري واجمع تساؤلات العملاء.", channels: ["instagram","snapchat"], cta: "اسألنا أي شيء" },
  { day:20, type: "offer",   title: "خصم تابع جديد", brief: "كود ترحيبي 10% لكل من يتابع لأول مرة.", channels: ["instagram","tiktok"], cta: "استخدم الكود" },
  { day:21, type: "product", title: "Best Seller", brief: "أكثر منتج مبيعاً + سبب نجاحه + صور احترافية.", channels: ["instagram","tiktok"], cta: "اطلب الأكثر مبيعاً" },
  { day:22, type: "news",    title: "إعلان تعاون", brief: "تعاون مع مؤثر صغير (Nano/Micro) من جمهورك.", channels: ["instagram","snapchat"], cta: "شاهد التعاون" },
  { day:23, type: "review",  title: "حالة عميل تفصيلية", brief: "قصة عميل واحد كاملة: المشكلة → الحل → النتيجة.", channels: ["instagram","x"], cta: "اقرأ القصة" },
  { day:24, type: "reel",    title: "ريل ترفيهي خفيف", brief: "محتوى ترفيهي مرتبط بفئة المنتج (مو إعلان مباشر).", channels: ["instagram","tiktok"], cta: "تابعنا للمزيد" },
  { day:25, type: "ugc",     title: "ريبوست محتوى متابع", brief: "أعد نشر فيديو/صورة لمتابع استخدم المنتج.", channels: ["instagram","tiktok"], cta: "شاركنا لحظتك" },
  { day:26, type: "offer",   title: "عرض نهاية الشهر", brief: "خصم 20% لـ 72 ساعة فقط على فئة محددة.", channels: ["instagram","whatsapp","snapchat"], cta: "احصل على الخصم" },
  { day:27, type: "product", title: "Coming Soon", brief: "تشويق لمنتج جديد سيُطلق الشهر القادم.", channels: ["instagram","x"], cta: "كن أول المعرفة" },
  { day:28, type: "story",   title: "شكر للعملاء", brief: "بوست/ستوري شكر للعملاء على شهر ناجح + إحصائيات عامة.", channels: ["instagram","snapchat"], cta: "شكراً لكم 🙏" },
  { day:29, type: "review",  title: "آراء + تقييمات سلة/زد", brief: "سكرين شوت من تقييمات متجرك في المنصة.", channels: ["instagram","x"], cta: "اشترِ بثقة" },
  { day:30, type: "news",    title: "خلاصة الشهر + القادم", brief: "ملخص أهم منتجات الشهر + تشويق لما سيأتي.", channels: ["instagram","tiktok","x"], cta: "تابع الشهر القادم" },
];

function Plan30Page() {
  const [filter, setFilter] = useState<PostType | "all">("all");
  const visible = useMemo(
    () => (filter === "all" ? SAMPLE_PLAN : SAMPLE_PLAN.filter((d) => d.type === filter)),
    [filter]
  );

  const stats = useMemo(() => {
    const counts: Record<PostType, number> = {
      product: 0, offer: 0, story: 0, review: 0, reel: 0, news: 0, ugc: 0, gift: 0,
    };
    SAMPLE_PLAN.forEach((d) => { counts[d.type]++; });
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-base font-bold text-primary">المسوّق الذكي</Link>
          <Link to="/subscribe" className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold">
            احصل على خطتك المخصصة
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-white">
            <Calendar className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">نموذج خطة 30 يوم</h1>
          <p className="mt-3 mx-auto max-w-2xl text-muted-foreground">
            هذا مثال على تقويم محتوى شهري حقيقي نولّده. الخطة الفعلية لمتجرك تكون أكثر تخصيصاً —
            مبنية على منتجاتك، أسعارك، وجمهورك المستهدف في السوق السعودي.
          </p>
        </div>

        {/* إحصائيات نوع المحتوى */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
              filter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border/60 hover:border-primary/40"
            }`}
          >
            الكل ({SAMPLE_PLAN.length})
          </button>
          {(Object.keys(stats) as PostType[]).map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  filter === t ? "border-primary bg-primary text-primary-foreground" : "border-border/60 hover:border-primary/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label} ({stats[t]})
              </button>
            );
          })}
        </div>

        {/* شبكة الأيام */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((d) => {
            const meta = TYPE_META[d.type];
            const Icon = meta.icon;
            return (
              <article
                key={d.day}
                className="rounded-2xl border border-border/60 bg-card/50 p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-2xl font-bold text-primary">يوم {d.day}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.color}`}>
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>
                <h3 className="mb-1.5 font-display text-base font-bold">{d.title}</h3>
                <p className="mb-3 text-sm text-muted-foreground leading-6">{d.brief}</p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {d.channels.map((c) => (
                    <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">
                      {CHANNEL_LABEL[c]}
                    </span>
                  ))}
                </div>
                <div className="mt-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">CTA:</span> {d.cta}
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h2 className="font-display text-2xl font-bold">هذي خطة عامة — خطتك راح تكون أدق</h2>
          <p className="mt-3 mx-auto max-w-2xl text-muted-foreground">
            عند الاشتراك نحلل متجرك تحديداً، نختار أنواع المحتوى المناسبة لفئة منتجاتك،
            ونعدّل التقويم كل أسبوع حسب الأداء الفعلي على KPIs.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/analyze" className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary/40">
              ابدأ بتحليل مجاني
            </Link>
            <Link to="/subscribe" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold">
              اشترك الآن — 1,500 ر.س
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <JustlatorFooter />
    </div>
  );
}
