import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Eye,
  CreditCard,
  Send,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "كيف يعمل المسوّق الذكي — ٤ خطوات بسيطة" },
      {
        name: "description",
        content:
          "شرح خطوة بخطوة لطريقة عمل المسوّق الذكي: تحليل المتجر، معاينة الحملة، الدفع الآمن، استلام الخطة والتقارير.",
      },
      { property: "og:title", content: "كيف يعمل المسوّق الذكي" },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    icon: Search,
    title: "حلّل متجرك مجاناً",
    body: "أدخل رابط متجرك (زد، سلة، Shopify…) ونحلّله بالذكاء الاصطناعي خلال دقيقة — نقاط القوة، الضعف، الفرص الفورية، و PDF جاهز.",
    cta: { label: "ابدأ التحليل", to: "/analyze" as const },
    deliver: "تقرير PDF + ٤-٦ توصيات قابلة للتنفيذ فوراً.",
  },
  {
    icon: Eye,
    title: "شوف معاينة الحملة قبل ما تدفع",
    body: "نبني لك عيّنة من خطتك: ٣ منشورات جاهزة + جدول نشر ٧ أيام + نموذج التقرير الأسبوعي — كله بدون التزام.",
    cta: { label: "جرّب المعاينة", to: "/preview" as const },
    deliver: "معاينة كاملة قابلة للنسخ.",
  },
  {
    icon: CreditCard,
    title: "اشترك بـ ١٬٥٠٠ ريال/شهر",
    body: "دفع شهري — لا عقود، لا اشتراك سنوي مُلزم. ادفع بالتحويل البنكي أو PayPal، ونفعّل حسابك خلال ساعات.",
    cta: { label: "صفحة الاشتراك", to: "/subscribe" as const },
    deliver: "تفعيل خلال ساعات + إيصال إلكتروني.",
  },
  {
    icon: Send,
    title: "استلم المحتوى وانشره أنت",
    body: "نسلّم لك خطة ٣٠ يوم: المنشورات جاهزة للنسخ، جدول النشر، الـ Hashtags، نصوص الفيديو. أنت تنشرها على حساباتك.",
    cta: { label: "نموذج الخطة", to: "/preview" as const },
    deliver: "٣٠ منشور + Hashtags + جدول.",
  },
  {
    icon: BarChart3,
    title: "تابع النتائج بلوحة KPIs آمنة",
    body: "ارفع بيانات Meta/Google/TikTok كـ CSV، ونحدّث لوحة KPIs مع بصمة SHA-256 (Append-only) — لا تلاعب بالأرقام.",
    cta: { label: "اطلع على الميزات", to: "/" as const },
    deliver: "تقارير أسبوعية + تصدير PDF/CSV.",
  },
];

const HONESTY = [
  {
    icon: CheckCircle2,
    label: "ما نتولّاه نحن",
    items: [
      "تحليل المتجر بالذكاء الاصطناعي",
      "كتابة ٣٠ منشور شهرياً جاهز للنسخ",
      "خطة محتوى مفصّلة (متى/أين/ماذا)",
      "تحليل المنافسين الدوري",
      "لوحة KPIs مؤمّنة + تقارير PDF",
    ],
    color: "border-success/30 bg-success/5 text-success",
  },
  {
    icon: Copy,
    label: "ما تتولّاه أنت",
    items: [
      "نسخ المنشورات ونشرها على حساباتك",
      "الرد على رسائل العملاء",
      "تنفيذ الطلبات والشحن",
      "رفع بيانات الأداء (CSV) للمتابعة",
    ],
    color: "border-gold/30 bg-gold/5 text-gold",
  },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            الرئيسية
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            كيف يعمل
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
            كيف يعمل <span className="text-primary">المسوّق الذكي؟</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            ٥ خطوات شفافة — بدون وعود مبالغ بها، بدون تعقيد. اقرأ بالضبط ماذا تستلم وماذا يبقى من مسؤوليتك.
          </p>
        </div>

        {/* Steps */}
        <section className="mt-12 space-y-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center md:p-7"
            >
              <div className="flex items-center gap-4 md:flex-col md:items-start">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <s.icon className="h-7 w-7" />
                </div>
                <span className="font-display text-3xl font-bold text-muted-foreground/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{s.body}</p>
                <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {s.deliver}
                </p>
              </div>
              <Link
                to={s.cta.to}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 md:self-center"
              >
                {s.cta.label}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </section>

        {/* Honesty grid */}
        <section className="mt-14">
          <h2 className="text-center font-display text-2xl font-bold md:text-3xl">
            الشفافية — من يفعل ماذا؟
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
            نتجنّب الوعود المبهمة. هذا التوزيع الواضح للأدوار.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {HONESTY.map((h, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${h.color}`}>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <h.icon className="h-5 w-5" />
                  {h.label}
                </h3>
                <ul className="space-y-2.5">
                  {h.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Timing & guarantees */}
        <section className="mt-14 grid gap-4 md:grid-cols-3">
          <InfoBox icon={Clock} title="الوقت" body="تفعيل خلال ساعات من استلام الإيصال. الخطة الأولى تصلك خلال ٢٤ ساعة." />
          <InfoBox icon={ShieldCheck} title="الأمان" body="بياناتك مشفّرة. لوحة KPIs Append-only ببصمة SHA-256 — لا تعديل، لا تزوير." />
          <InfoBox
            icon={Sparkles}
            title="الإلغاء"
            body="بدون عقود — تقدر توقف الاشتراك في أي شهر بدون رسوم إلغاء."
          />
        </section>

        {/* Final CTA */}
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-8 text-primary-foreground">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="font-display text-2xl font-bold">جاهز تجرّب؟</h3>
              <p className="mt-2 text-sm opacity-95">
                ابدأ بالتحليل المجاني، أو احسب نقطة التعادل بأرقامك، أو شوف معاينة الحملة.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/calculator"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold backdrop-blur hover:bg-white/25"
              >
                حاسبة التعادل
              </Link>
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary hover:opacity-90"
              >
                ابدأ التحليل المجاني
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <JustlatorFooter />
    </div>
  );
}

function InfoBox({ icon: Icon, title, body }: { icon: typeof Clock; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="mt-3 font-bold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
