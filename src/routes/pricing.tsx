import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CreditCard, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "الأسعار — المسوّق الذكي | 1500 ريال شهرياً" },
      {
        name: "description",
        content:
          "باقة واحدة بسعر 1500 ريال شهرياً. تحويل بنكي مباشر أو PayPal.me. بوابة دفع جاهزة لأصحاب متاجر سلة وزد في السعودية.",
      },
      { property: "og:title", content: "الأسعار — المسوّق الذكي" },
      {
        property: "og:description",
        content: "1500 ريال / شهر. تحويل بنكي أو PayPal.me. مصمّم لمتاجر سلة وزد.",
      },
    ],
  }),
  component: PricingPage,
});

const PAYPAL_URL = "https://paypal.me/justlator";

const FEATURES = [
  "تحليل متجرك (سلة/زد) بالذكاء الاصطناعي",
  "خطة تسويق متكاملة 30 يوم بالعربية",
  "مراقبة المنافسين يومياً بشكل تلقائي",
  "لوحة KPIs مضادة للعبث (شفافية كاملة)",
  "استيراد بيانات Meta/Google/TikTok/Snap",
  "تقارير PDF احترافية بالعربي",
  "تحديث التحليل تلقائياً كل أسبوعين",
  "دعم فني مباشر عبر واتساب",
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-primary py-20 text-white">
        <div className="absolute inset-0 bg-hero-radial opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            باقة واحدة. سعر واضح. بدون مفاجآت
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold md:text-6xl">
            مدير تسويق ذكي يعمل ٢٤/٧
            <br />
            <span className="text-gold">بسعر موظف ليوم واحد</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base opacity-90 md:text-lg">
            مصمّم خصيصاً لأصحاب متاجر <strong>سلة</strong> و <strong>زد</strong> في السعودية والخليج.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="overflow-hidden rounded-3xl border-2 border-gold/40 bg-card shadow-gold">
            <div className="relative overflow-hidden bg-gradient-primary p-10 text-center text-white">
              <div className="absolute inset-0 bg-hero-radial opacity-30" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-bold backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  الباقة التأسيسية
                </div>
                <div className="mt-6 flex items-baseline justify-center gap-2">
                  <span className="font-display text-7xl font-bold">١٬٥٠٠</span>
                  <span className="text-2xl opacity-90">ريال / شهر</span>
                </div>
                <p className="mt-2 text-sm opacity-90">يُجدّد تلقائياً — إلغاء في أي وقت</p>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <ul className="grid gap-4 sm:grid-cols-2">
                {FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/subscribe"
                className="btn-gold mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold"
              >
                اشترك الآن وفعّل حسابك
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="rounded-full bg-success/10 px-3 py-1 font-semibold text-success">
                  ✓ متاجر سلة
                </span>
                <span className="rounded-full bg-success/10 px-3 py-1 font-semibold text-success">
                  ✓ متاجر زد
                </span>
                <span className="rounded-full bg-success/10 px-3 py-1 font-semibold text-success">
                  ✓ Shopify
                </span>
                <span className="rounded-full bg-success/10 px-3 py-1 font-semibold text-success">
                  ✓ متاجر مستقلة
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-10">
            <h2 className="text-center font-display text-2xl font-bold">
              طرق الدفع <span className="text-gradient-gold">المتاحة</span>
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              اختر الطريقة الأنسب لك — التفعيل خلال ساعات بعد التأكيد
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {/* Bank Transfer */}
              <Link
                to="/subscribe"
                className="group rounded-2xl border-2 border-primary/30 bg-card p-6 transition hover:border-primary hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold">تحويل بنكي مباشر</div>
                    <div className="text-xs text-muted-foreground">البنك الأهلي السعودي (SNB)</div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  حوّل المبلغ على IBAN ثم أرسل الإيصال عبر واتساب. التفعيل خلال ساعات.
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-bold text-primary">
                  ابدأ التحويل
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </div>
              </Link>

              {/* PayPal */}
              <a
                href={PAYPAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border-2 border-gold/30 bg-card p-6 transition hover:border-gold hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-foreground">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold">PayPal.me</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      paypal.me/justlator
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  ادفع مباشرة عبر رابط PayPal.me الآمن. مناسب للعملاء داخل وخارج السعودية.
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-bold text-foreground">
                  ادفع عبر PayPal
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </div>
              </a>
            </div>
          </div>

          {/* Trust */}
          <div className="mt-12 rounded-2xl bg-muted/30 p-6 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-success" />
            <p className="mt-3 text-sm text-muted-foreground">
              منصّة سعودية موثوقة • بياناتك محمية بتشفير SHA-256 وسياسات RLS صارمة •{" "}
              <Link to="/terms" className="text-primary underline">
                الشروط والأحكام
              </Link>{" "}
              •{" "}
              <Link to="/privacy" className="text-primary underline">
                الخصوصية
              </Link>
            </p>
          </div>
        </div>
      </section>

      <JustlatorFooter />
    </div>
  );
}
