import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Radio, Calendar, Coins, TrendingUp, AlertCircle, Download, Filter } from "lucide-react";
import { aggregateKpis, listKpiEntries, type KpiEntry } from "@/lib/kpi.functions";

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

const SUBSCRIPTION_COST_SAR = 1500;

type FilterKey = "all" | "paid_ads" | "tiktok_ads" | "snapchat_ads";

const FILTER_OPTIONS: { key: FilterKey; label: string; sources: string[] | null }[] = [
  { key: "all", label: "كل المصادر", sources: null },
  { key: "paid_ads", label: "TikTok + Snapchat", sources: ["tiktok_ads", "snapchat_ads"] },
  { key: "tiktok_ads", label: "TikTok Ads", sources: ["tiktok_ads"] },
  { key: "snapchat_ads", label: "Snapchat Ads", sources: ["snapchat_ads"] },
];

function fmt(n: number, digits = 0) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("ar-SA", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function isoWeekStart(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = (day + 1) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type Props = {
  userId: string;
  planId?: string | null;
};

export function KpiExtendedAnalytics({ userId, planId }: Props) {
  const fetchEntries = useServerFn(listKpiEntries);
  const [entries, setEntries] = useState<KpiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgOrder, setAvgOrder] = useState<number>(150);
  const [margin, setMargin] = useState<number>(35);
  const [filter, setFilter] = useState<FilterKey>("paid_ads");

  useEffect(() => {
    setLoading(true);
    fetchEntries({ data: { userId, marketingPlanId: planId ?? null } })
      .then((r) => setEntries(r.entries))
      .finally(() => setLoading(false));
  }, [userId, planId, fetchEntries]);

  const activeSources = FILTER_OPTIONS.find((f) => f.key === filter)?.sources ?? null;

  const filtered = useMemo(() => {
    if (!activeSources) return entries;
    return entries.filter((e) => activeSources.includes(e.source));
  }, [entries, activeSources]);

  const total = useMemo(() => aggregateKpis(filtered), [filtered]);

  const byChannel = useMemo(() => {
    const map = new Map<string, KpiEntry[]>();
    filtered.forEach((e) => {
      const key = e.channel || "all";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries())
      .map(([channel, list]) => ({ channel, agg: aggregateKpis(list), count: list.length }))
      .sort((a, b) => b.agg.conversions - a.agg.conversions);
  }, [filtered]);

  const bySource = useMemo(() => {
    const map = new Map<string, KpiEntry[]>();
    filtered.forEach((e) => {
      if (!map.has(e.source)) map.set(e.source, []);
      map.get(e.source)!.push(e);
    });
    return Array.from(map.entries())
      .map(([source, list]) => ({ source, agg: aggregateKpis(list), count: list.length }))
      .sort((a, b) => Number(b.agg.costSar) - Number(a.agg.costSar));
  }, [filtered]);

  const weeklyTrend = useMemo(() => {
    const map = new Map<string, KpiEntry[]>();
    filtered.forEach((e) => {
      const wk = isoWeekStart(e.period_start);
      if (!map.has(wk)) map.set(wk, []);
      map.get(wk)!.push(e);
    });
    const rows = Array.from(map.entries())
      .map(([week, list]) => ({ week, agg: aggregateKpis(list) }))
      .sort((a, b) => a.week.localeCompare(b.week));
    const maxConv = Math.max(1, ...rows.map((r) => r.agg.conversions));
    const maxCost = Math.max(1, ...rows.map((r) => Number(r.agg.costSar)));
    return { rows, maxConv, maxCost };
  }, [filtered]);

  // ROI
  const revenue = total.conversions * avgOrder;
  const grossProfit = revenue * (margin / 100);
  const netAfterAds = grossProfit - Number(total.costSar);
  const netAfterAll = netAfterAds - SUBSCRIPTION_COST_SAR;
  const roas = Number(total.costSar) > 0 ? revenue / Number(total.costSar) : 0;
  const breakevenOrders =
    avgOrder > 0 && margin > 0
      ? Math.ceil((SUBSCRIPTION_COST_SAR + Number(total.costSar)) / (avgOrder * (margin / 100)))
      : 0;

  // Week-over-week deltas (last vs prev)
  const wow = useMemo(() => {
    const r = weeklyTrend.rows;
    if (r.length < 2) return null;
    const cur = r[r.length - 1].agg;
    const prev = r[r.length - 2].agg;
    const delta = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100);
    return {
      week: r[r.length - 1].week,
      conv: delta(cur.conversions, prev.conversions),
      cost: delta(Number(cur.costSar), Number(prev.costSar)),
      cpa: delta(cur.cpa, prev.cpa),
    };
  }, [weeklyTrend]);

  function exportWeeklyCsv() {
    const header = ["أسبوع يبدأ", "مشاهدات", "نقرات", "CTR%", "تحويلات", "CVR%", "تكلفة ر.س", "CPA ر.س"];
    const rows: (string | number)[][] = [header];
    weeklyTrend.rows.forEach((r) => {
      rows.push([
        r.week,
        r.agg.views,
        r.agg.clicks,
        Number(r.agg.ctr.toFixed(2)),
        r.agg.conversions,
        Number(r.agg.cvr.toFixed(2)),
        Number(Number(r.agg.costSar).toFixed(2)),
        Number(r.agg.cpa.toFixed(2)),
      ]);
    });
    downloadCsv(`kpi-weekly-${filter}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
        جاري تحميل التحليلات الموسّعة…
      </section>
    );
  }
  if (entries.length === 0) {
    return (
      <section className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center">
        <BarChart3 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          التحليلات الموسّعة ستظهر هنا فور استيراد بياناتك من TikTok / Snapchat (CSV) أو إدخالها يدوياً.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-6">
      {/* Source Filter */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Filter className="h-4 w-4 text-primary" />
          فلترة حسب المصدر
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const count = opt.sources
              ? entries.filter((e) => opt.sources!.includes(e.source)).length
              : entries.length;
            const active = filter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                disabled={count === 0}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                {opt.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            لا توجد بيانات لهذا المصدر. استورد ملف CSV من{" "}
            <a href="/integrations" className="text-primary underline">صفحة التكامل</a>.
          </p>
        )}
      </div>

      {filtered.length > 0 && (
        <>
          {/* ROI Calculator */}
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-bl from-primary/5 to-transparent p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <Coins className="h-5 w-5 text-primary" />
              حاسبة العائد الفعلي (ROI)
            </h3>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">متوسط قيمة الطلب (ر.س)</span>
                <input
                  type="number"
                  min={1}
                  value={avgOrder}
                  onChange={(e) => setAvgOrder(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">هامش الربح الصافي (%)</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={margin}
                  onChange={(e) => setMargin(Math.min(100, Math.max(1, Number(e.target.value) || 0)))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <RoiCard label="إيرادات تقديرية" value={`${fmt(revenue, 0)} ر.س`} />
              <RoiCard label="ربح إجمالي" value={`${fmt(grossProfit, 0)} ر.س`} />
              <RoiCard
                label="صافي بعد الإعلانات"
                value={`${fmt(netAfterAds, 0)} ر.س`}
                tone={netAfterAds >= 0 ? "good" : "bad"}
              />
              <RoiCard
                label="صافي بعد الاشتراك"
                value={`${fmt(netAfterAll, 0)} ر.س`}
                tone={netAfterAll >= 0 ? "good" : "bad"}
                sub={`الاشتراك: ${SUBSCRIPTION_COST_SAR} ر.س/شهر`}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-3 text-sm">
                <div className="text-xs text-muted-foreground">ROAS (إيراد ÷ تكلفة إعلانات)</div>
                <div className="mt-1 font-display text-xl font-bold">{fmt(roas, 2)}x</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3 text-sm">
                <div className="text-xs text-muted-foreground">طلبات التعادل المطلوبة</div>
                <div className="mt-1 font-display text-xl font-bold">{fmt(breakevenOrders, 0)} طلب</div>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              أرقام تقديرية مبنية على متوسط الطلب والهامش. الإيرادات الفعلية تظهر في سلة/زد.
            </p>
          </div>

          {/* Weekly Report */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <Calendar className="h-5 w-5 text-primary" />
                التقرير الأسبوعي
              </h3>
              {weeklyTrend.rows.length > 0 && (
                <button
                  type="button"
                  onClick={exportWeeklyCsv}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-primary"
                >
                  <Download className="h-3.5 w-3.5" />
                  تصدير CSV
                </button>
              )}
            </div>

            {wow && (
              <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <WowCard label="التحويلات" value={wow.conv} good="up" />
                <WowCard label="الإنفاق" value={wow.cost} good="down" />
                <WowCard label="CPA" value={wow.cpa} good="down" />
              </div>
            )}

            {weeklyTrend.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات أسبوعية بعد.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {weeklyTrend.rows.map((r) => {
                    const convPct = (r.agg.conversions / weeklyTrend.maxConv) * 100;
                    const costPct = (Number(r.agg.costSar) / weeklyTrend.maxCost) * 100;
                    return (
                      <div key={r.week} className="rounded-xl border border-border p-3">
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold">أسبوع يبدأ {r.week}</span>
                          <span className="text-muted-foreground">
                            {fmt(r.agg.conversions)} تحويل • {fmt(Number(r.agg.costSar), 0)} ر.س •
                            CPA {r.agg.conversions > 0 ? `${fmt(r.agg.cpa, 2)} ر.س` : "—"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-[10px] text-muted-foreground">تحويلات</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-emerald-500" style={{ width: `${convPct}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-[10px] text-muted-foreground">إنفاق</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary" style={{ width: `${costPct}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* By Source */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              توزيع الإنفاق حسب المصدر
            </h3>
            <div className="space-y-2">
              {bySource.map((row) => {
                const pct = Number(total.costSar) > 0 ? (Number(row.agg.costSar) / Number(total.costSar)) * 100 : 0;
                return (
                  <div key={row.source} className="rounded-xl border border-border p-3">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-bold">{SOURCE_LABEL[row.source] ?? row.source}</span>
                      <span className="text-xs text-muted-foreground">
                        {fmt(Number(row.agg.costSar), 2)} ر.س • {fmt(pct, 1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gradient-to-l from-primary to-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      {fmt(row.agg.conversions)} تحويل •{" "}
                      {row.agg.conversions > 0 ? `${fmt(row.agg.cpa, 2)} ر.س CPA` : "بدون تحويلات بعد"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Channel */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <Radio className="h-5 w-5 text-primary" />
              الأداء حسب القناة
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pe-2">القناة</th>
                    <th className="py-2 pe-2">إدخالات</th>
                    <th className="py-2 pe-2">مشاهدات</th>
                    <th className="py-2 pe-2">نقرات</th>
                    <th className="py-2 pe-2">CTR</th>
                    <th className="py-2 pe-2">تحويلات</th>
                    <th className="py-2 pe-2">CVR</th>
                    <th className="py-2 pe-2">تكلفة</th>
                    <th className="py-2 pe-2">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {byChannel.map((row) => (
                    <tr key={row.channel} className="border-b border-border/50">
                      <td className="py-2 pe-2 font-bold">{row.channel}</td>
                      <td className="py-2 pe-2 text-xs text-muted-foreground">{row.count}</td>
                      <td className="py-2 pe-2">{fmt(row.agg.views)}</td>
                      <td className="py-2 pe-2">{fmt(row.agg.clicks)}</td>
                      <td className="py-2 pe-2">{fmt(row.agg.ctr, 2)}%</td>
                      <td className="py-2 pe-2">{fmt(row.agg.conversions)}</td>
                      <td className="py-2 pe-2">{fmt(row.agg.cvr, 2)}%</td>
                      <td className="py-2 pe-2 whitespace-nowrap">{fmt(Number(row.agg.costSar), 2)} ر.س</td>
                      <td className="py-2 pe-2 whitespace-nowrap">
                        {row.agg.conversions > 0 ? `${fmt(row.agg.cpa, 2)} ر.س` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function RoiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  const color =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "bad"
      ? "text-rose-600 dark:text-rose-400"
      : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-lg font-bold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function WowCard({ label, value, good }: { label: string; value: number; good: "up" | "down" }) {
  const isGood = good === "up" ? value >= 0 : value <= 0;
  const color = isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
  const sign = value > 0 ? "+" : "";
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label} مقارنة بالأسبوع السابق</div>
      <div className={`mt-1 font-display text-lg font-bold ${color}`}>
        {sign}{fmt(value, 1)}%
      </div>
    </div>
  );
}
