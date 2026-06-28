import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Loader2, Sparkles, Target, Users, Megaphone, CalendarDays, BarChart3, Zap, Download } from "lucide-react";
import { generateMarketingPlan, listMarketingPlans, type MarketingPlan } from "@/lib/marketing-plan.functions";

type SavedPlan = {
  id: string;
  store_url: string;
  plan: MarketingPlan;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
}

export function MarketingPlanSection({
  userId,
  hasAnalysis,
  initialPlans,
}: {
  userId: string;
  hasAnalysis: boolean;
  initialPlans: SavedPlan[];
}) {
  const genFn = useServerFn(generateMarketingPlan);
  const [plans, setPlans] = useState<SavedPlan[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [goal, setGoal] = useState("");

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const extra: { monthlyBudget?: number; primaryGoal?: string } = {};
      const n = Number(budget);
      if (n > 0) extra.monthlyBudget = n;
      if (goal.trim()) extra.primaryGoal = goal.trim();
      const res = await genFn({ data: { userId, extra: Object.keys(extra).length ? extra : undefined } });
      setPlans((prev) => [
        { id: res.id!, store_url: res.storeUrl, plan: res.plan, created_at: res.createdAt ?? new Date().toISOString() },
        ...prev,
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر توليد الخطة");
    } finally {
      setLoading(false);
    }
  }

  const latest = plans[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">خطة التسويق المتكاملة</h2>
          <p className="text-sm text-muted-foreground">
            خطة شاملة بالعربي للسوق السعودي، مبنية على تحليل متجرك الأخير.
          </p>
        </div>
      </div>

      {!hasAnalysis ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-6 text-center text-sm text-muted-foreground">
          شغّل تحليل متجرك أولاً من الأعلى، ثم ارجع وولّد خطتك.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              type="number"
              placeholder="ميزانية شهرية مقترحة (ريال) — اختياري"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="هدفك الرئيسي (مثال: زيادة الطلبات 30%) — اختياري"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري توليد الخطة (قد يأخذ دقيقة)...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {latest ? "ولّد خطة جديدة" : "ولّد خطتي الآن"}
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {latest && (
            <div className="mt-6">
              <PlanCard plan={latest.plan} createdAt={latest.created_at} />
              {plans.length > 1 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-bold text-muted-foreground hover:text-primary">
                    الخطط السابقة ({plans.length - 1})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {plans.slice(1).map((p) => (
                      <PlanCard key={p.id} plan={p.plan} createdAt={p.created_at} compact />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}

function PlanCard({ plan, createdAt, compact }: { plan: MarketingPlan; createdAt: string; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">خطة تسويق — {formatDate(createdAt)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
        </div>
        <button
          onClick={() => printPlan(plan, createdAt)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gold/40 bg-gold/5 px-3 py-1.5 text-xs font-bold text-gold transition hover:bg-gold hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>

      {!compact && (
        <div className="mt-5 space-y-6">
          <Block icon={<Target className="h-4 w-4" />} title="الأهداف" color="text-primary">
            <div className="grid gap-2 sm:grid-cols-2">
              {plan.goals.map((g, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-bold">{g.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {g.metric} — هدف: <strong>{g.target}</strong> خلال {g.timeframe}
                  </p>
                </div>
              ))}
            </div>
          </Block>

          <Block icon={<Users className="h-4 w-4" />} title="الجمهور المستهدف" color="text-purple-600">
            <PersonaCard p={plan.audience?.primaryPersona} label="الشخصية الرئيسية" />
            {plan.audience?.secondaryPersona && (
              <PersonaCard p={plan.audience.secondaryPersona} label="الشخصية الثانوية" />
            )}
          </Block>

          <Block icon={<Megaphone className="h-4 w-4" />} title="القنوات التسويقية" color="text-success">
            <div className="space-y-3">
              {plan.channels.map((c, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">{c.name}</p>
                    <span className="text-xs font-bold text-success">{c.monthlyBudgetSar} ر.س / شهري</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.why}</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {c.tactics?.map((t, j) => (
                      <li key={j} className="rounded bg-muted/40 px-2 py-1">• {t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Block>

          <Block icon={<CalendarDays className="h-4 w-4" />} title="تقويم محتوى 30 يوم" color="text-cyan-600">
            <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/60">
                  <tr>
                    <th className="px-2 py-2 text-right">اليوم</th>
                    <th className="px-2 py-2 text-right">المنصة</th>
                    <th className="px-2 py-2 text-right">الصيغة</th>
                    <th className="px-2 py-2 text-right">الفكرة</th>
                    <th className="px-2 py-2 text-right">CTA</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.contentCalendar?.map((c, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="px-2 py-1.5">{c.day}</td>
                      <td className="px-2 py-1.5 font-bold">{c.platform}</td>
                      <td className="px-2 py-1.5">{c.format}</td>
                      <td className="px-2 py-1.5">{c.hook}</td>
                      <td className="px-2 py-1.5 text-primary">{c.cta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>

          <Block icon={<Megaphone className="h-4 w-4" />} title="الحملات الإعلانية" color="text-destructive">
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.adCampaigns?.map((a, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{a.platform}</p>
                    <span className="text-xs font-bold text-success">{a.budgetSar} ر.س</span>
                  </div>
                  <p className="mt-1 text-xs"><strong>الهدف:</strong> {a.objective}</p>
                  <p className="mt-1 text-xs"><strong>الجمهور:</strong> {a.audience}</p>
                  <p className="mt-1 text-xs"><strong>الزاوية:</strong> {a.creativeAngle}</p>
                  <p className="mt-2 rounded bg-muted/40 px-2 py-1.5 text-xs leading-relaxed">{a.adCopy}</p>
                  <p className="mt-1 text-xs text-muted-foreground">KPI متوقع: {a.expectedKpi}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block icon={<BarChart3 className="h-4 w-4" />} title="مؤشرات قياس الأداء (KPIs)" color="text-blue-600">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {plan.kpis?.map((k, i) => (
                <div key={i} className="rounded-lg border border-border p-2.5 text-xs">
                  <p className="font-bold">{k.name}</p>
                  <p className="text-muted-foreground">هدف: {k.target} — {k.frequency}</p>
                </div>
              ))}
            </div>
          </Block>

          {plan.budgetBreakdown && (
            <Block icon={<BarChart3 className="h-4 w-4" />} title={`توزيع الميزانية (${plan.budgetBreakdown.totalSar} ر.س)`} color="text-gold">
              <div className="space-y-1.5">
                {plan.budgetBreakdown.items?.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-xs">{b.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gold" style={{ width: `${b.percent}%` }} />
                    </div>
                    <span className="w-24 shrink-0 text-left text-xs font-bold">{b.amountSar} ر.س ({b.percent}%)</span>
                  </div>
                ))}
              </div>
            </Block>
          )}

          {plan.quickWins?.length > 0 && (
            <Block icon={<Zap className="h-4 w-4" />} title="انتصارات سريعة (نفّذها هذا الأسبوع)" color="text-orange-600">
              <ul className="space-y-1.5 text-xs">
                {plan.quickWins.map((q, i) => (
                  <li key={i} className="rounded bg-orange-500/5 px-3 py-2">⚡ {q}</li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      )}
    </div>
  );
}

function Block({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className={`mb-2 flex items-center gap-2 text-sm font-bold ${color}`}>
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function PersonaCard({ p, label }: { p: { name: string; age: string; city: string; interests: string[]; painPoints: string[]; triggers: string[] } | undefined; label: string }) {
  if (!p) return null;
  return (
    <div className="mb-2 rounded-lg border border-border p-3">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">
        {p.name} — {p.age} — {p.city}
      </p>
      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
        <div>
          <p className="mb-1 font-bold">اهتمامات</p>
          <ul className="space-y-0.5">{p.interests?.map((x, i) => <li key={i}>• {x}</li>)}</ul>
        </div>
        <div>
          <p className="mb-1 font-bold">آلام</p>
          <ul className="space-y-0.5">{p.painPoints?.map((x, i) => <li key={i}>• {x}</li>)}</ul>
        </div>
        <div>
          <p className="mb-1 font-bold">محفّزات الشراء</p>
          <ul className="space-y-0.5">{p.triggers?.map((x, i) => <li key={i}>• {x}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function printPlan(plan: MarketingPlan, createdAt: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  const date = formatDate(createdAt);
  const goalsHtml = plan.goals.map((g) => `<li><strong>${g.title}</strong> — ${g.metric}: ${g.target} (${g.timeframe})</li>`).join("");
  const channelsHtml = plan.channels.map((c) => `<div class="card"><h4>${c.name} <span>${c.monthlyBudgetSar} ر.س/شهر</span></h4><p>${c.why}</p><ul>${(c.tactics||[]).map(t=>`<li>${t}</li>`).join("")}</ul></div>`).join("");
  const calendarHtml = (plan.contentCalendar||[]).map((c) => `<tr><td>${c.day}</td><td><strong>${c.platform}</strong></td><td>${c.format}</td><td>${c.hook}</td><td>${c.cta}</td></tr>`).join("");
  const adsHtml = (plan.adCampaigns||[]).map((a) => `<div class="card"><h4>${a.platform} — ${a.budgetSar} ر.س</h4><p><strong>الهدف:</strong> ${a.objective}</p><p><strong>الجمهور:</strong> ${a.audience}</p><p><strong>الزاوية:</strong> ${a.creativeAngle}</p><blockquote>${a.adCopy}</blockquote><small>KPI: ${a.expectedKpi}</small></div>`).join("");
  const kpisHtml = (plan.kpis||[]).map((k) => `<li><strong>${k.name}</strong> — ${k.target} (${k.frequency})</li>`).join("");
  const budgetHtml = plan.budgetBreakdown?.items?.map((b) => `<tr><td>${b.label}</td><td>${b.amountSar} ر.س</td><td>${b.percent}%</td></tr>`).join("") || "";
  const quickHtml = (plan.quickWins||[]).map((q)=>`<li>${q}</li>`).join("");
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>خطة تسويق — ${date}</title>
  <style>
  body{font-family:'Tajawal',-apple-system,sans-serif;max-width:900px;margin:32px auto;padding:24px;color:#222;line-height:1.7}
  h1{color:#0a4d8f;border-bottom:3px solid #0a4d8f;padding-bottom:8px}
  h2{color:#0a4d8f;margin-top:32px;border-right:4px solid #d4a017;padding-right:10px}
  h4{margin:0 0 6px;display:flex;justify-content:space-between;color:#0a4d8f}
  .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
  th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:right}
  th{background:#f3f4f6}
  blockquote{background:#f9fafb;padding:8px 12px;border-right:3px solid #d4a017;margin:6px 0;font-size:13px}
  small{color:#6b7280}
  .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:12px}
  @media print { body{margin:0} }
  </style></head><body>
  <h1>خطة التسويق المتكاملة</h1>
  <p><strong>التاريخ:</strong> ${date}</p>
  <p>${plan.summary}</p>
  <h2>الأهداف</h2><ul>${goalsHtml}</ul>
  <h2>القنوات التسويقية</h2>${channelsHtml}
  <h2>تقويم المحتوى 30 يوم</h2>
  <table><thead><tr><th>اليوم</th><th>المنصة</th><th>الصيغة</th><th>الفكرة</th><th>CTA</th></tr></thead><tbody>${calendarHtml}</tbody></table>
  <h2>الحملات الإعلانية</h2>${adsHtml}
  <h2>مؤشرات الأداء (KPIs)</h2><ul>${kpisHtml}</ul>
  ${plan.budgetBreakdown ? `<h2>توزيع الميزانية — الإجمالي ${plan.budgetBreakdown.totalSar} ر.س</h2><table><thead><tr><th>البند</th><th>المبلغ</th><th>النسبة</th></tr></thead><tbody>${budgetHtml}</tbody></table>` : ""}
  <h2>انتصارات سريعة</h2><ul>${quickHtml}</ul>
  <div class="footer">تم توليده بواسطة المسوّق الذكي — justmarketing.justlator.com</div>
  <script>window.print()</script>
  </body></html>`);
  w.document.close();
}

export { listMarketingPlans };
