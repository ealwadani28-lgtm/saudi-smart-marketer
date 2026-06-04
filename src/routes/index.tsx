import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Search,
  Users,
  ClipboardList,
  CreditCard,
  Send,
  Wallet,
  Clock,
  AlertTriangle,
  Mail,
  Link as LinkIcon,
  Check,
  Twitter,
  Linkedin,
  ChevronDown,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ogImage from "@/assets/og-image.jpg.asset.json";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المسوق الذكي — تسويق صادق للمتاجر السعودية" },
      {
        name: "description",
        content:
          "حملة تسويقية كاملة ٣٠ يوم بـ ٩٩٩ ريال فقط. تحليل مجاني لمتجرك على زد وسلة. شفافية كاملة، بدون عقود، بدون وعود كاذبة.",
      },
      { property: "og:title", content: "المسوق الذكي — تسويق صادق للمتاجر السعودية" },
      {
        property: "og:description",
        content: "حملة تسويقية كاملة ٣٠ يوم بـ ٩٩٩ ريال فقط. شفافية كاملة، بدون عقود، بدون وعود كاذبة.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: ogImage.url },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "ar_SA" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "المسوق الذكي — تسويق صادق للمتاجر السعودية" },
      { name: "twitter:description", content: "حملة تسويقية كاملة ٣٠ يوم بـ ٩٩٩ ريال فقط" },
      { name: "twitter:image", content: ogImage.url },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});


function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">


      <Nav />
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <ComparisonSection />
      <PricingSection />
      <SocialProofSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
      <ExitIntentPopup />
    </div>
  );
}

/* ---------------- NAV ---------------- */

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">المسوق الذكي</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#problem" className="transition hover:text-primary">المشكلة</a>
          <a href="#solution" className="transition hover:text-primary">الحل</a>
          <a href="#pricing" className="transition hover:text-primary">السعر</a>
          <a href="#faq" className="transition hover:text-primary">الأسئلة</a>
        </nav>
        <a
          href="#final-cta"
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
        >
          ابدأ مجاناً
          <ArrowLeft className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}

/* ---------------- HERO ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-radial">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 pt-16 pb-24 md:grid-cols-12 md:pt-24 md:pb-32">
        {/* Right side (60%) — RTL means first child appears on the right */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="md:col-span-7"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            للمتاجر السعودية الصغيرة على زد وسلة
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.2] md:text-6xl">
            دفعت <span className="text-gradient-primary">٢٠ ألف ريال</span> للمسوقين
            <br />
            وما استفدت شي.
            <br />
            <span className="text-gradient-gold">قررت أبني الحل بنفسي.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            <span className="font-bold text-foreground">المسوق الذكي:</span> تسويق صادق بسعر منافس.
            ما نعدك بالنتائج، لكن نعدك بالتنفيذ المحكم والتقارير الواضحة.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/try"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg transition hover:opacity-90"
            >
              <Sparkles className="h-5 w-5" />
              جرّب المسوّق الذكي الآن — مجاناً
            </Link>
            <a href="#waitlist" className="inline-flex items-center justify-center rounded-xl border-2 border-border bg-background px-6 py-4 text-base font-medium transition hover:border-primary hover:text-primary">
              سجّل في قائمة الأوائل
            </a>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            تجربة مباشرة — بدون تسجيل، بدون التزام
          </div>

        </motion.div>

        {/* Left side (40%) — Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative md:col-span-5"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-md">
      {/* Glow halos behind mockup */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.06, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 30%, rgba(0,168,89,0.45), transparent 70%), radial-gradient(55% 55% at 20% 80%, rgba(212,175,55,0.40), transparent 70%)",
        }}
      />
      {/* Main mockup */}
      <div className="relative rounded-3xl border border-border bg-card p-6 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">لوحة متجرك</span>
          </div>
          <div className="h-2 w-2 rounded-full bg-success" />
        </div>

        <div className="mb-4 rounded-2xl bg-gradient-primary p-5 text-white">
          <div className="text-xs opacity-90">حملة نشطة</div>
          <div className="mt-1 font-display text-2xl font-bold">اليوم ١٤ من ٣٠</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "46%" }}
              viewport={{ amount: 0.6 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full bg-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="منشورات نُشرت" value="١٤" tone="primary" />
          <MiniStat label="مشاهدات" value="٢٤٫٧ك" tone="gold" />
          <MiniStat label="تفاعلات" value="١٬٢٣٠" tone="success" />
          <MiniStat label="نقرات للمتجر" value="٣٤٢" tone="primary" />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          تقرير الأسبوع الثاني جاهز
        </div>
      </div>

      {/* Floating cards */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="glass-card absolute -top-6 -right-6 rounded-2xl px-4 py-3"
      >
        <div className="text-xs text-muted-foreground">سعر الحملة</div>
        <div className="font-display text-lg font-bold text-primary">٩٩٩ ر.س</div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="glass-card absolute -bottom-6 -left-6 rounded-2xl px-4 py-3"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-success" />
          منشور جديد
        </div>
        <div className="mt-1 text-sm font-semibold">نُشر على تيك توك</div>
      </motion.div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "gold" | "success";
}) {
  const colorMap = {
    primary: "text-primary",
    gold: "text-gold",
    success: "text-success",
  };
  return (
    <div className="rounded-xl border border-border bg-secondary p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-xl font-bold ${colorMap[tone]}`}>{value}</div>
    </div>
  );
}

/* ---------------- PROBLEM ---------------- */

function ProblemSection() {
  const pains = [
    {
      icon: Wallet,
      emoji: "💸",
      title: "غالي ومحد يستحق",
      body: "المسوقين يطلبون ٣-١٠ آلاف ريال شهرياً. والنتائج؟ محتوى عام ما يشد حد. فلوسك تضيع والمتجر ما ينمو.",
    },
    {
      icon: Clock,
      emoji: "⏰",
      title: "ما عندي وقت",
      body: "مشغول بالطلبات والشحن والعملاء. التسويق يحتاج ٣-٥ ساعات يومياً. النتيجة: المتجر يبقى خفي.",
    },
    {
      icon: AlertTriangle,
      emoji: "🤥",
      title: "وعود كاذبة",
      body: "«نضمن لك مبيعات!» «راح تصير فايرل!» بالآخر: لا شي. وفلوسك راحت.",
    },
  ];

  return (
    <section id="problem" className="relative overflow-hidden bg-ink py-24 text-ink-foreground">
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full bg-destructive/20 px-4 py-1 text-xs font-semibold text-destructive-foreground">
            المشكلة الحقيقية
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">
            المشكلة اللي عشتها
            <br />
            <span className="text-gradient-gold">(وعايشها ٨٠ ألف متجر سعودي)</span>
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pains.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 80, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 1.0, delay: i * 0.25, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.25 } }}
              className="glass-card-dark rounded-2xl p-7 transition-shadow hover:shadow-glow"
            >
              <div className="mb-4 text-4xl">{p.emoji}</div>
              <h3 className="font-display text-xl font-bold">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-white/75">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- SOLUTION ---------------- */

function SolutionSection() {
  const steps = [
    {
      n: "١",
      icon: Search,
      title: "تحليل متجرك (مجاني!)",
      body: "الذكاء الاصطناعي يفحص منتجاتك ويعطيك تقرير نقاط القوة والضعف.",
    },
    {
      n: "٢",
      icon: Users,
      title: "دراسة المنافسين والسوق",
      body: "٥-١٠ متاجر منافسة + ترندات تيك توك وسناب السعودية.",
    },
    {
      n: "٣",
      icon: ClipboardList,
      title: "خطة ٣٠ يوم كاملة",
      body: "محتوى + جدول نشر + استراتيجية. تشوف الخطة كاملة قبل ما تدفع!",
    },
    {
      n: "٤",
      icon: CreditCard,
      title: "أنت توافق وتدفع",
      body: "٩٩٩ ريال لحملة ٣٠ يوم. تحويل بنكي أو PayPal.",
    },
    {
      n: "٥",
      icon: Send,
      title: "التنفيذ والتقارير",
      body: "نشر تلقائي على تيك توك وسناب + تقارير أسبوعية + تقرير نهائي.",
    },
  ];

  return (
    <section id="solution" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full bg-accent px-4 py-1 text-xs font-semibold text-primary">
            الحل الصادق
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">
            الحل: <span className="text-gradient-primary">مسوق ذكي يشتغل بصدق</span>
          </h2>
        </motion.div>

        {/* Core Promise Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.25 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-12 max-w-3xl"
        >
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-accent to-background p-8 md:p-10 shadow-glow">
            <div className="absolute -top-3 right-8 rounded-full bg-gradient-gold px-4 py-1 text-xs font-bold">
              وعد المؤسس
            </div>
            <p className="font-display text-lg leading-loose md:text-xl">
              «أعطني عنوان متجرك وسأقوم بدراسته ومعرفة نقاط القوة والضعف في التسويق، ومن ثم سأضع لك
              خطة تسويق متكاملة بناءً على دراستي للسوق والمتاجر المنافسة.
              <br />
              <br />
              <span className="font-bold text-primary">
                لا أضمن النتائج، لكنني أضمن سعراً منافساً وتنفيذاً محكماً للخطة المرسومة وتقارير
                واضحة.»
              </span>
            </p>
          </div>
        </motion.div>

        {/* 5-Step Process */}
        <div className="mt-16 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 80, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ amount: 0.25 }}
              transition={{ duration: 0.9, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.25 } }}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-glow"
            >
              <div className="absolute -top-4 right-4 grid h-10 w-10 place-items-center rounded-xl bg-gradient-gold font-display text-lg font-bold text-gold-foreground shadow-gold">
                {s.n}
              </div>
              <div className="mt-3 grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- COMPARISON ---------------- */

function ComparisonSection() {
  const rows = [
    { label: "السعر", others: "٣٬٠٠٠ - ١٠٬٠٠٠ ريال/شهر", us: "٩٩٩ ريال لحملة ٣٠ يوم" },
    { label: "الالتزام", others: "عقود ٦-١٢ شهر", us: "٣٠ يوم فقط، بدون عقود" },
    { label: "الشفافية", others: "ما تشوف الخطة قبل الدفع", us: "توافق على الخطة قبل الدفع!" },
    { label: "الوعود", others: "«نضمن لك مبيعات!» (كذب)", us: "صادقين: نضمن التنفيذ" },
    { label: "التقارير", others: "شهرياً (وأحياناً ما في)", us: "أسبوعياً + تقرير نهائي" },
  ];

  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            ليش <span className="text-gradient-primary">المسوق الذكي</span> مختلف عن الباقي؟
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
        >
          {/* Desktop / tablet table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-3 gap-0 border-b border-border bg-muted/40">
              <div className="p-5 text-sm font-bold text-muted-foreground">المقارنة</div>
              <div className="p-5 text-center text-sm font-bold text-muted-foreground">
                المسوقين العاديين
              </div>
              <div className="bg-gradient-primary p-5 text-center text-sm font-bold text-white">
                المسوق الذكي
              </div>
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 gap-0 border-b border-border last:border-b-0 ${
                  i % 2 === 0 ? "bg-card" : "bg-muted/30"
                }`}
              >
                <div className="p-5 font-bold">{r.label}</div>
                <div className="flex items-center justify-center gap-2 p-5 text-center text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  <span>{r.others}</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-accent/40 p-5 text-center text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  <span>{r.us}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile stacked cards */}
          <div className="divide-y divide-border sm:hidden">
            {rows.map((r, i) => (
              <div key={i} className="p-5">
                <div className="mb-3 font-display text-lg font-bold">{r.label}</div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div>
                      <div className="mb-0.5 text-[11px] font-bold">المسوقين العاديين</div>
                      <span>{r.others}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl bg-accent/40 p-3 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <div>
                      <div className="mb-0.5 text-[11px] font-bold text-primary">المسوق الذكي</div>
                      <span>{r.us}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- PRICING ---------------- */

function PricingSection() {
  const features = [
    "تحليل متجرك مجاناً",
    "دراسة ٥-١٠ منافسين",
    "خطة تسويق ٣٠ يوم مفصلة",
    "٣٠+ تصميم ومقطع فيديو (عربي)",
    "نشر تلقائي على تيك توك وسناب شات",
    "٤ تقارير أسبوعية",
    "تقرير نهائي شامل بنهاية الحملة",
    "دعم فني طوال الحملة",
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full bg-gold/15 px-4 py-1 text-xs font-bold text-foreground">
            باقة واحدة. سعر واضح.
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">
            سعر واحد، واضح، <span className="text-gradient-gold">بدون مفاجآت</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.25 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 overflow-hidden rounded-3xl border-2 border-gold/40 bg-card shadow-gold"
        >
          <div className="relative overflow-hidden bg-gradient-primary p-10 text-center text-white">
            <div className="absolute inset-0 bg-hero-radial opacity-30" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-bold backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" />
                الباقة التأسيسية
              </div>
              <div className="mt-6 flex items-baseline justify-center gap-2">
                <span className="font-display text-7xl font-bold">٩٩٩</span>
                <span className="text-2xl opacity-90">ريال فقط</span>
              </div>
              <p className="mt-2 text-sm opacity-90">لحملة تسويقية كاملة ٣٠ يوم</p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <ul className="grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href="#final-cta"
              className="btn-gold mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold"
            >
              احجز مكانك في القائمة المبكرة
              <ArrowLeft className="h-5 w-5" />
            </a>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              قارن: المسوقين يطلبون{" "}
              <span className="font-bold text-destructive line-through">٣٬٠٠٠ - ١٠٬٠٠٠ ريال</span>{" "}
              شهرياً!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- SOCIAL PROOF ---------------- */

function SocialProofSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block rounded-full bg-gold/20 px-4 py-1 text-xs font-bold text-gold">
            ٢٠٢٦ — قائمة الأوائل
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">
            شكراً إنك من الأوائل المهتمين 🌱
          </h2>
          <p className="mt-6 text-base leading-relaxed opacity-90 md:text-lg">
            بصراحة كاملة: إحنا حالياً في مرحلة بناء وتجربة فعلية على متاجر حقيقية،
            عشان لما نطلق لك المنتج يكون <span className="font-bold text-gold">مجرّب ومضمون</span> — مش مجرد وعود.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 max-w-2xl rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md md:p-8"
        >
          <h3 className="mb-4 text-center font-display text-xl font-bold md:text-2xl">
            وش راح يوصلك؟
          </h3>
          <ul className="mb-8 space-y-4 text-right text-sm md:text-base">
            <li className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <span><span className="font-bold">تقرير أسبوعي</span> بنتائج التجارب الفعلية — أرقام حقيقية، تكاليف حقيقية، بدون فلترة.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <span><span className="font-bold">دعوة حصرية</span> لتجربة الـ Beta مجاناً قبل الإطلاق الرسمي.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <span><span className="font-bold">شفافية كاملة</span> — نشاركك القرارات والتحديثات أول بأول، بدون وعود ما نقدر نلتزم فيها.</span>
            </li>

          </ul>

          <SignupForm cta="سجّلني في قائمة الأوائل" onDark />

          <p className="mt-5 text-center text-xs leading-relaxed opacity-80 md:text-sm">
            <span className="font-bold">متى الإطلاق؟</span> بنبلغك أول بأول — ما راح نطلق إلا لما نتأكد إن المنتج يستحق فلوسك.
            <br />
            <span className="opacity-70">— فريق المسوق الذكي</span>
          </p>

        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

function FAQSection() {
  const faqs = [
    {
      q: "هل تضمنون زيادة المبيعات؟",
      a: "لا. نحن صادقون معك: التسويق علم وليس سحراً. ما نضمن لك «مبيعات مضمونة» أو «فايرل مضمون» — هذي كلها وعود كاذبة. اللي نضمنه: تنفيذ محكم، محتوى احترافي، وتقارير واضحة.",
    },
    {
      q: "ليش ما تضمنون النتائج؟",
      a: "لأننا صادقين. النتائج تعتمد على عوامل كثيرة (منتجاتك، أسعارك، السوق). اللي نقدر نتحكم فيه: جودة التنفيذ. وهذا اللي نضمنه.",
    },
    {
      q: "كيف أعرف إن المحتوى راح يكون جيد؟",
      a: "راح تشوف الخطة كاملة (٣٠ يوم من المحتوى) قبل ما تدفع ريال واحد. ما عجبتك؟ لا تدفع. بسيطة.",
    },
    {
      q: "هل أقدر أشوف الخطة قبل ما أدفع؟",
      a: "نعم! هذا الفرق الأساسي بيننا وبين الباقي. راح نعطيك خطة كاملة ٣٠ يوم. توافق عليها؟ تدفع. ما توافق؟ لا تدفع.",
    },
    {
      q: "إيش الفرق بينكم وبين المسوقين العاديين؟",
      a: "١) السعر: ٩٩٩ ريال مقابل ٣-١٠ آلاف ريال شهرياً. ٢) الشفافية: تشوف كل شي قبل الدفع. ٣) الصدق: ما نعدك بالمستحيل. ٤) التقارير: أسبوعياً مو شهرياً.",
    },
    {
      q: "هل المحتوى راح يكون بالعربي؟",
      a: "١٠٠٪ عربي سعودي. مو ترجمة من الإنجليزي. محتوى مفهوم للسوق السعودي بالضبط.",
    },
    {
      q: "كم تاخذ الحملة؟",
      a: "٣٠ يوم بالضبط. يوم واحد = منشور واحد. بعد ٣٠ يوم، تقدر تجدد (أو لا تجدد). قرارك.",
    },
    {
      q: "إيش لو ما عجبتني النتائج؟",
      a: "راح تحصل على تقرير نهائي شامل يوضح إيش اشتغل وإيش ما اشتغل. تقدر تستفيد منه حتى لو ما جددت معنا.",
    },
  ];

  return (
    <section id="faq" className="bg-secondary py-24">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <span className="inline-block rounded-full bg-accent px-4 py-1 text-xs font-bold text-primary">
            FAQ
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">
            الأسئلة الشائعة
          </h2>
        </motion.div>

        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="overflow-hidden rounded-2xl border border-border bg-card px-6 shadow-soft data-[state=open]:border-primary/30"
            >
              <AccordionTrigger className="py-5 text-right font-display text-base font-bold hover:no-underline md:text-lg [&>svg]:hidden">
                <span className="flex w-full items-center justify-between gap-4">
                  <span>{f.q}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform duration-200" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------------- FINAL CTA ---------------- */

function FinalCTA() {
  return (
    <section
      id="final-cta"
      className="relative overflow-hidden bg-ink py-24 text-ink-foreground"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-gold/20" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl font-bold md:text-6xl"
        >
          جاهز تجرب
          <br />
          <span className="text-gradient-gold">تسويق صادق؟</span>
        </motion.h2>
        <p className="mt-6 text-lg text-white/80 md:text-xl">
          احصل على تحليل متجرك مجاناً — بدون التزام، بدون دفع.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 max-w-xl rounded-3xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-md md:p-8"
        >
          <SignupForm cta="سجّل في القائمة المبكرة" onDark />
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
          <TrustBadge>بدون عقود طويلة</TrustBadge>
          <TrustBadge>توقف متى ما تبي</TrustBadge>
          <TrustBadge>شفافية ١٠٠٪</TrustBadge>
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-white/85">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-success text-white">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {children}
    </div>
  );
}

/* ---------------- SIGNUP FORM ---------------- */

function SignupForm({
  cta,
  compact,
  onDark,
}: {
  cta: string;
  compact?: boolean;
  onDark?: boolean;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [shop, setShop] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("الرجاء إدخال بريد إلكتروني صحيح");
  const [loading, setLoading] = useState(false);

  const inputBase = onDark
    ? "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/60 outline-none transition focus:border-gold focus:bg-white/15"
    : "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!valid) {
      setErrorMsg("الرجاء إدخال بريد إلكتروني صحيح");
      setStatus("error");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("early_signups").insert({
      email: cleanEmail,
      shop_url: shop.trim() || null,
      source: "landing_page",
    });
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setErrorMsg("هذا البريد مسجل مسبقاً!");
      } else {
        setErrorMsg("حدث خطأ، الرجاء المحاولة مرة أخرى");
      }
      setStatus("error");
      toast.error(errorMsg);
      return;
    }

    setStatus("ok");
    setEmail("");
    setShop("");
    toast.success("تم التسجيل بنجاح!");
    navigate({ to: "/thank-you" });
  }

  if (status === "ok") {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border p-5 ${
          onDark
            ? "border-gold/40 bg-white/10 text-white"
            : "border-success/30 bg-success/10 text-foreground"
        }`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success text-white">
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
        <div className="text-right">
          <div className="font-display font-bold">تم التسجيل بنجاح!</div>
          <div className="text-sm opacity-80">شكراً! راح نراسلك بمجرد الإطلاق.</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="relative">
        <Mail
          className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
            onDark ? "text-white/60" : "text-muted-foreground"
          }`}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="بريدك الإلكتروني"
          className={`${inputBase} pr-12`}
          maxLength={255}
        />
      </div>

      {!compact && (
        <div className="relative">
          <LinkIcon
            className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
              onDark ? "text-white/60" : "text-muted-foreground"
            }`}
          />
          <input
            type="url"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="رابط متجرك على زد أو سلة (اختياري)"
            className={`${inputBase} pr-12`}
            maxLength={500}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold transition disabled:opacity-60 ${
          onDark ? "btn-gold" : "btn-primary"
        }`}
      >
        {loading ? "جاري التسجيل..." : cta}
        {!loading && <ArrowLeft className="h-5 w-5" />}
      </button>

      {status === "error" && (
        <p className={`text-sm ${onDark ? "text-gold" : "text-destructive"}`}>
          {errorMsg}
        </p>
      )}
    </form>
  );
}

/* ---------------- FOOTER ---------------- */

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold">المسوق الذكي</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              تسويق صادق للمتاجر السعودية 🇸🇦
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Twitter"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="transition hover:text-primary">سياسة الخصوصية</a>
            <a href="/terms" className="transition hover:text-primary">شروط الاستخدام</a>
          </div>

        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © ٢٠٢٦ المسوق الذكي. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
