import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Calculator, TrendingUp, Info } from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";

const PRICE_SAR = 1500;

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "حاسبة التعادل — كم طلب أحتاج لأغطي تكلفة الحملة؟" },
      {
        name: "description",
        content:
          "احسب بسرعة كم طلباً يكفي لتغطية تكلفة حملة المسوّق الذكي (١٬٥٠٠ ريال/شهر) — حاسبة شفافة بدون وعود مبالغ بها.",
      },
      { property: "og:title", content: "حاسبة التعادل — المسوّق الذكي" },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const [aov, setAov] = useState(200); // متوسط قيمة الطلب
  const [margin, setMargin] = useState(40); // هامش الربح %
  const [currentOrders, setCurrentOrders] = useState(50); // عدد الطلبات الحالي شهرياً

  const calc = useMemo(() => {
    const grossPerOrder = (aov * margin) / 100;
    const ordersToBreakEven = grossPerOrder > 0 ? Math.ceil(PRICE_SAR / grossPerOrder) : Infinity;
    const upliftPct = currentOrders > 0 ? ((ordersToBreakEven / currentOrders) * 100).toFixed(1) : "—";
    const revenueToBreakEven = ordersToBreakEven * aov;
    return { grossPerOrder, ordersToBreakEven, upliftPct, revenueToBreakEven };
  }, [aov, margin, currentOrders]);

  const feasible = calc.ordersToBreakEven !== Infinity && calc.ordersToBreakEven <= currentOrders * 2;

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            الرئيسية
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Calculator className="h-3 w-3" />
            حاسبة التعادل
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 md:py-14">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
            كم طلب أحتاج <span className="text-primary">لأغطي تكلفة الحملة؟</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            أدخل أرقامك الواقعية ونحسب لك نقطة التعادل بكل شفافية — بدون وعود مضمونة، بدون مبالغة.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Inputs */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold">أرقامك</h2>
            <div className="space-y-5">
              <NumberField
                label="متوسط قيمة الطلب (ريال)"
                value={aov}
                onChange={setAov}
                min={10}
                max={5000}
                step={10}
                hint="مجموع المبيعات ÷ عدد الطلبات في آخر شهر"
              />
              <NumberField
                label="هامش الربح الصافي (%)"
                value={margin}
                onChange={setMargin}
                min={5}
                max={90}
                step={1}
                hint="نسبة الربح بعد تكلفة المنتج والشحن"
              />
              <NumberField
                label="عدد الطلبات الحالي (شهرياً)"
                value={currentOrders}
                onChange={setCurrentOrders}
                min={1}
                max={5000}
                step={1}
                hint="معدّل طلباتك الشهري حالياً"
              />
            </div>
          </div>

          {/* Results */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/0 p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold">النتيجة</h2>
            <div className="space-y-4">
              <ResultRow label="هامش الربح للطلب الواحد" value={`${calc.grossPerOrder.toFixed(0)} ريال`} />
              <ResultRow
                label="عدد الطلبات الإضافية للتعادل"
                value={
                  calc.ordersToBreakEven === Infinity ? "—" : `${calc.ordersToBreakEven} طلب/شهر`
                }
                highlight
              />
              <ResultRow
                label="إيراد التعادل الشهري"
                value={
                  calc.ordersToBreakEven === Infinity
                    ? "—"
                    : `${calc.revenueToBreakEven.toLocaleString("ar-SA")} ريال`
                }
              />
              <ResultRow
                label="نسبة الزيادة المطلوبة من قاعدتك الحالية"
                value={calc.upliftPct === "—" ? "—" : `${calc.upliftPct}%`}
              />
            </div>

            <div
              className={`mt-6 rounded-xl border p-4 text-sm ${
                feasible
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-gold/30 bg-gold/5 text-gold-foreground"
              }`}
            >
              {feasible ? (
                <>
                  <strong>✓ التعادل واقعي.</strong> تحتاج زيادة معقولة من معدّلك الحالي لتغطية تكلفة الحملة.
                </>
              ) : (
                <>
                  <strong>⚠ التعادل صعب نسبياً.</strong> إما رفع متوسط قيمة الطلب أو تحسين الهامش أو زيادة قاعدة
                  العملاء قبل الاشتراك.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-bold text-foreground">ملاحظة شفافية</p>
              <p className="mt-1">
                هذه الحاسبة <strong>أداة تخطيط فقط</strong>، ليست ضماناً للنتائج. النتائج الفعلية تعتمد على جودة
                منتجك، عروضك، استجابة جمهورك، وتنفيذ المحتوى. المسوّق الذكي يوفّر لك المحتوى والخطة والتقارير —
                النشر والتفاعل مع العملاء يبقى من مسؤوليتك.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-8 text-primary-foreground">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="font-display text-2xl font-bold">جاهز تشوف خطتك الفعلية؟</h3>
              <p className="mt-2 text-sm opacity-95">
                ابدأ بتحليل مجاني لمتجرك، أو شوف معاينة الحملة قبل ما تدفع.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold backdrop-blur hover:bg-white/25"
              >
                <TrendingUp className="h-4 w-4" />
                حلّل متجري
              </Link>
              <Link
                to="/preview"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary hover:opacity-90"
              >
                معاينة الحملة
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

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        highlight ? "border-primary/40 bg-primary/10" : "border-border bg-background"
      }`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-base font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
