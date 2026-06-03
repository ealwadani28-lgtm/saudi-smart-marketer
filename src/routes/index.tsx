import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Sparkles,
  ShieldCheck,
  LineChart,
  Eye,
  Clock,
  Wallet,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Store,
  Bot,
  FileText,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المسوق الذكي — تسويق صادق للمتاجر السعودية" },
      {
        name: "description",
        content:
          "خطة تسويقية متكاملة مدعومة بالذكاء الاصطناعي لمتاجر زد وسلة. شفافية كاملة، تنفيذ محكم، وتقارير أسبوعية — بـ ٩٩٩ ريال فقط بدلاً من آلاف الريالات شهرياً.",
      },
      { property: "og:title", content: "المسوق الذكي — تسويق صادق للمتاجر السعودية" },
      {
        property: "og:description",
        content: "تحليل متجرك، دراسة المنافسين، وخطة ٣٠ يوماً تُنفّذ تلقائياً على تيك توك وسناب شات.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@500;600;700&family=Tajawal:wght@400;500;700;800&display=swap"
        rel="stylesheet"
      />

      <Nav />
      <Hero />
      <PainSection />
      <HonestPromise />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-gold text-gold-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">المسوق الذكي</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground transition">كيف يعمل</a>
          <a href="#promise" className="hover:text-foreground transition">وعدنا</a>
          <a href="#pricing" className="hover:text-foreground transition">الباقة</a>
        </nav>
        <a
          href="#pricing"
          className="rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-gold transition hover:opacity-90"
        >
          ابدأ الآن
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-80" />

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 md:pt-32 md:pb-40">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            مصنوع في السعودية — لمتاجر زد وسلة
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            تسويق <span className="text-gradient-gold">صادق</span> لمتجرك،
            <br />
            بدون وعود زائفة.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            أعطني عنوان متجرك، وسأدرسه، وأحلّل منافسيك، وأرسم لك خطة تسويق متكاملة لـ ٣٠ يوماً تُنفَّذ
            تلقائياً على تيك توك وسناب شات.{" "}
            <span className="text-foreground">لا أضمن لك نتائج خيالية</span> — لكنني أضمن تنفيذاً
            محكماً وتقارير شفافة.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-gold px-7 py-4 text-base font-bold text-gold-foreground shadow-gold transition hover:scale-[1.02]"
            >
              حلّل متجري الآن
              <ArrowLeft className="h-4 w-4" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/40 px-7 py-4 text-base font-semibold backdrop-blur transition hover:bg-card/70"
            >
              كيف يعمل؟
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Stat value="٩٩٩ ر.س" label="رسوم لمرة واحدة" />
            <span className="h-1 w-1 rounded-full bg-border" />
            <Stat value="٣٠ يوم" label="خطة كاملة" />
            <span className="h-1 w-1 rounded-full bg-border" />
            <Stat value="٠ مفاجآت" label="شفافية كاملة" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-lg font-bold text-gradient-gold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

function PainSection() {
  const pains = [
    { icon: Wallet, text: "وكالات تسويق تأخذ ٣٬٠٠٠ إلى ١٠٬٠٠٠ ريال شهرياً" },
    { icon: XCircle, text: "وعود بـ«نتائج مضمونة» لا تتحقق أبداً" },
    { icon: Clock, text: "محتوى عام لا يفهم السوق السعودي" },
    { icon: Store, text: "٤٠٪ من المتاجر الصغيرة تُغلق في أول سنة" },
  ];

  return (
    <section className="border-y border-border/50 bg-card/30 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            دفعتُ ٢٠٬٠٠٠ ريال لوكالة تسويق، ولم أحصل على شيء.
          </h2>
          <p className="mt-4 text-muted-foreground">
            هذه القصة تتكرر مع ٨٠٬٠٠٠ صاحب متجر سعودي كل يوم. بنينا «المسوق الذكي» حتى لا تتكررها معك.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {pains.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card/60 p-5"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
                <p.icon className="h-5 w-5" />
              </div>
              <p className="pt-2 text-foreground">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HonestPromise() {
  const yes = [
    "محتوى احترافي بثقافة سعودية أصيلة لـ ٣٠ يوم",
    "نشر آلي على تيك توك وسناب شات",
    "تحليل المنافسين والاتجاهات بالذكاء الاصطناعي",
    "تقارير أسبوعية بأرقام حقيقية — بدون تجميل",
    "تعتمد الخطة قبل أن تدفع ريالاً واحداً",
  ];
  const no = [
    "«١٠٬٠٠٠ متابع في ٧ أيام!»",
    "«منشورات فيروسية مضمونة!»",
    "«ضاعف مبيعاتك فوراً!»",
  ];

  return (
    <section id="promise" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-gold">
            وعدنا الصادق
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            الصدق هو ميزتنا التنافسية
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-gold/40 bg-card/60 p-8 shadow-gold"
          >
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-gold" />
              <h3 className="font-display text-xl font-bold">نَعِدُك بـ:</h3>
            </div>
            <ul className="space-y-4">
              {yes.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-foreground">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-gold" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card/30 p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-destructive" />
              <h3 className="font-display text-xl font-bold">لن نَعِدَك بـ:</h3>
            </div>
            <ul className="space-y-4">
              {no.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground line-through">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive/60" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              لأن أي شخص يَعِدُك بهذا — يكذب عليك.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Store,
      title: "أعطنا رابط متجرك",
      desc: "من زد، سلة، أو أي منصة. خطوة واحدة، أقل من دقيقة.",
    },
    {
      icon: Bot,
      title: "نحلل ونرسم الخطة",
      desc: "ذكاؤنا الاصطناعي يدرس متجرك ومنافسيك ويبني خطة ٣٠ يوماً مفصّلة.",
    },
    {
      icon: Eye,
      title: "تراجع وتعتمد",
      desc: "تشاهد كل منشور وكل تصميم قبل أن يُنشر. لا شيء يحدث بدون موافقتك.",
    },
    {
      icon: LineChart,
      title: "ننفّذ ونرسل تقارير",
      desc: "نشر تلقائي على تيك توك وسناب شات + تقرير أسبوعي شفاف.",
    },
  ];

  return (
    <section id="how" className="border-y border-border/50 bg-card/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-gold">
            كيف يعمل
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            من رابط متجرك إلى حملة كاملة — في ٤ خطوات
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-border bg-background/60 p-6"
            >
              <div className="absolute -top-3 right-6 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-gold-foreground">
                {["١", "٢", "٣", "٤"][i]}
              </div>
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald">
                <s.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const features = [
    "تحليل كامل لمتجرك ومنافسيك",
    "خطة تسويق ٣٠ يوماً مفصّلة",
    "محتوى احترافي باللهجة السعودية",
    "تصاميم منشورات بالذكاء الاصطناعي",
    "ريلز تيك توك تلقائية",
    "نشر آلي على تيك توك + سناب شات",
    "تقارير أسبوعية شفافة",
    "دعم فني طوال مدة الحملة",
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-gold">
            باقة واحدة. سعر واحد.
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            بدلاً من ٣٬٠٠٠ ريال شهرياً
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-12 overflow-hidden rounded-3xl border border-gold/40 bg-card shadow-glow"
        >
          <div className="bg-gradient-emerald p-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/30 px-4 py-1 text-xs font-semibold backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              الباقة التأسيسية
            </div>
            <div className="mt-6 flex items-baseline justify-center gap-2">
              <span className="font-display text-6xl font-bold text-gradient-gold">٩٩٩</span>
              <span className="text-xl text-muted-foreground">ر.س</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              دفعة واحدة • حملة ٣٠ يوماً كاملة
            </p>
          </div>

          <div className="p-8">
            <ul className="grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href="#"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-gold px-7 py-4 text-base font-bold text-gold-foreground shadow-gold transition hover:scale-[1.01]"
            >
              <FileText className="h-5 w-5" />
              ابدأ بتحليل متجري — مجاناً
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              التحليل والخطة مجاناً. ادفع فقط إذا اعتمدت الخطة.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/30 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-gold text-gold-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span>© {new Date().getFullYear()} المسوق الذكي — صُنع بصدق في السعودية 🇸🇦</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">سياسة الخصوصية</a>
          <a href="#" className="hover:text-foreground">الشروط</a>
          <a href="#" className="hover:text-foreground">تواصل</a>
        </div>
      </div>
    </footer>
  );
}
