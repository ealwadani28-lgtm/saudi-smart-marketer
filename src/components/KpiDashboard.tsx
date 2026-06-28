import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ExternalLink, Lock, TrendingUp, Eye, MousePointerClick, Target, Wallet, Info } from "lucide-react";
import {
  listKpiEntries,
  aggregateKpis,
  computeKpiProgress,
  type KpiEntry,
} from "@/lib/kpi.functions";
import type { MarketingPlan } from "@/lib/marketing-plan.functions";

const SOURCE_LABEL: Record<string, string> = {
  meta_ads: "Meta Ads",
  tiktok_ads: "TikTok Ads",
  google_ads: "Google Ads",
  snapchat_ads: "Snapchat Ads",
  x_ads: "X Ads",
  ga4: "Google Analytics 4",
  search_console: "Search Console",
  shopify: "Shopify",
  salla: "سلة",
  zid: "زد",
  manual_dashboard: "لوحة المعلن",
};

function fmt(n: number, digits = 0) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("ar-SA", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

type Props = {
  userId: string;
  plan?: MarketingPlan | null;
  planId?: string | null;
};

export function KpiDashboard({ userId, plan, planId }: Props) {
  const fetchEntries = useServerFn(listKpiEntries);
  const [entries, setEntries] = useState<KpiEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchEntries({ data: { userId, marketingPlanId: planId ?? null } })
      .then((r) => setEntries(r.entries))
      .finally(() => setLoading(false));
  }, [userId, planId, fetchEntries]);

  const agg = useMemo(() => aggregateKpis(entries), [entries]);

  const planProgress = useMemo(() => {
    if (!plan?.kpis) return [];
    return plan.kpis.map((k) => ({
      name: k.name,
      target: k.target,
      frequency: k.frequency,
      progress: computeKpiProgress(k.name, k.target, agg),
    }));
  }, [plan, agg]);

  return (
    <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <TrendingUp className="h-5 w-5 text-primary" />
          لوحة الأداء (KPIs)
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          سجل موثّق وغير قابل للتعديل
        </span>
      </div>

      <p className="mb-5 flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        كل رقم هنا يُدخله فريق المسوّق الذكي من مصادر رسمية (لوحات الإعلانات، Google Analytics...) مع رابط إثبات لكل إدخال،
        ويُختم تلقائياً ببصمة SHA-256 وختم زمني في قاعدة بياناتنا. لا يمكن لأحد — ولا حتى الإدارة — تعديل أو حذف الأرقام بعد الإدخال.
        الحسابات (CTR / CVR / CPA) تتم تلقائياً من المجاميع.
      </p>

      {/* Aggregate cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard icon={<Eye className="h-4 w-4" />} label="المشاهدات" value={fmt(agg.views)} />
        <MetricCard icon={<MousePointerClick className="h-4 w-4" />} label="النقرات" value={fmt(agg.clicks)} sub={`CTR ${fmt(agg.ctr, 2)}%`} />
        <MetricCard icon={<Target className="h-4 w-4" />} label="التحويلات" value={fmt(agg.conversions)} sub={`CVR ${fmt(agg.cvr, 2)}%`} />
        <MetricCard icon={<Wallet className="h-4 w-4" />} label="الإنفاق" value={`${fmt(agg.costSar, 2)} ر.س`} sub={agg.conversions > 0 ? `CPA ${fmt(agg.cpa, 2)} ر.س` : agg.clicks > 0 ? `CPC ${fmt(agg.cpc, 2)} ر.س` : undefined} />
      </div>

      {/* Plan goals progress */}
      {plan && planProgress.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-bold">التقدّم مقابل أهداف الخطة</h3>
          <div className="space-y-3">
            {planProgress.map((p, i) => (
              <div key={i} className="rounded-2xl border border-border p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="font-bold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">الهدف: {p.target} • {p.frequency}</span>
                </div>
                {p.progress ? (
                  <>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-gradient-to-l from-primary to-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, p.progress.percent)}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>الحالي: <b className="text-foreground">{fmt(p.progress.actual, p.progress.unit === "%" ? 2 : 0)} {p.progress.unit}</b></span>
                      <span><b className="text-foreground">{fmt(p.progress.percent, 0)}%</b> من الهدف</span>
                    </div>
                  </>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5" /> لا توجد بيانات كافية لقياس هذا الهدف بعد.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit log */}
      <div className="mt-6">
        <h3 className="mb-3 font-bold">سجل الإدخالات الموثّقة ({entries.length})</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">جاري التحميل…</p>
        ) : entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            لا توجد إدخالات بعد. سيبدأ الفريق في تسجيل أرقام أدائك من المصادر الرسمية ابتداءً من أول فترة قياس.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pe-2">الفترة</th>
                  <th className="py-2 pe-2">القناة</th>
                  <th className="py-2 pe-2">المصدر</th>
                  <th className="py-2 pe-2">مشاهدات</th>
                  <th className="py-2 pe-2">نقرات</th>
                  <th className="py-2 pe-2">تحويلات</th>
                  <th className="py-2 pe-2">تكلفة</th>
                  <th className="py-2 pe-2">إثبات</th>
                  <th className="py-2 pe-2">البصمة</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-2 pe-2 whitespace-nowrap text-xs">{e.period_start} ← {e.period_end}</td>
                    <td className="py-2 pe-2">{e.channel}</td>
                    <td className="py-2 pe-2 text-xs">{SOURCE_LABEL[e.source] ?? e.source}</td>
                    <td className="py-2 pe-2">{fmt(e.views)}</td>
                    <td className="py-2 pe-2">{fmt(e.clicks)}</td>
                    <td className="py-2 pe-2">{fmt(e.conversions)}</td>
                    <td className="py-2 pe-2 whitespace-nowrap">{fmt(Number(e.cost_sar), 2)} ر.س</td>
                    <td className="py-2 pe-2">
                      <a
                        href={e.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        فتح <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-2 pe-2 font-mono text-[10px] text-muted-foreground" title={`SHA-256 • مختوم في ${new Date(e.sealed_at).toLocaleString("ar-SA")}`}>
                      {e.entry_hash.slice(0, 10)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="font-display text-xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
