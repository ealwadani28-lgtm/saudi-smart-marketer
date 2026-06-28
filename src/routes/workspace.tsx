import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles, LogOut, CheckCircle2, Clock, AlertCircle,
  Store, CalendarDays, ChevronRight, FileText, Loader2, Download, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspace } from "@/lib/customer.functions";
import { analyzeStorePaid, listStoreAnalyses, type StoreSnapshot, type StoreReport } from "@/lib/analyzer.functions";
import { listMarketingPlans } from "@/lib/marketing-plan.functions";
import { printStoreReport } from "@/lib/storeReportPdf";
import { ContentPlanView } from "@/components/ContentPlanView";
import { MarketingPlanSection } from "@/components/MarketingPlanSection";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "مساحة عملك — المسوق الذكي" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WorkspacePage,
});

type Update = {
  id: string;
  type: string;
  title: string;
  body: string;
  done: boolean;
  created_at: string;
};

type Customer = {
  full_name: string;
  shop_url: string | null;
  shop_name: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  status: string;
};

type Analysis = {
  id: string;
  store_url: string;
  snapshot: StoreSnapshot;
  report: StoreReport;
  created_at: string;
  next_refresh_at: string | null;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  welcome:    <Sparkles className="h-5 w-5 text-primary" />,
  analysis:   <Store className="h-5 w-5 text-gold" />,
  plan:       <CalendarDays className="h-5 w-5 text-success" />,
  post:       <CheckCircle2 className="h-5 w-5 text-success" />,
  report:     <ChevronRight className="h-5 w-5 text-primary" />,
  alert:      <AlertCircle className="h-5 w-5 text-destructive" />,
};

function daysLeft(end: string | null) {
  if (!end) return null;
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
}

function WorkspacePage() {
  const navigate = useNavigate();
  const fetchWorkspace = useServerFn(getWorkspace);
  const runAnalysis = useServerFn(analyzeStorePaid);
  const listAnalyses = useServerFn(listStoreAnalyses);
  const listPlans = useServerFn(listMarketingPlans);

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [marketingPlans, setMarketingPlans] = useState<Array<{ id: string; store_url: string; plan: import("@/lib/marketing-plan.functions").MarketingPlan; created_at: string }>>([]);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Analyzer form state
  const [shopUrlInput, setShopUrlInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        const adminToken = sessionStorage.getItem("admin_token_v2") || localStorage.getItem("admin_token_v2");
        if (adminToken) {
          navigate({ to: "/admin" });
          return;
        }
        navigate({ to: "/login" });
        return;
      }
      setUserId(session.user.id);
      try {
        const [ws, an, mp] = await Promise.all([
          fetchWorkspace({ data: { userId: session.user.id } }),
          listAnalyses({ data: { userId: session.user.id } }),
          listPlans({ data: { userId: session.user.id } }),
        ]);
        setCustomer(ws.customer);
        setUpdates(ws.updates);
        setAnalyses(an.analyses as Analysis[]);
        setMarketingPlans(mp.plans as typeof marketingPlans);
        if (ws.customer?.shop_url) setShopUrlInput(ws.customer.shop_url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "حدث خطأ");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function handleAnalyze() {
    if (!userId || !shopUrlInput.trim()) return;
    setAnalyzeError("");
    setAnalyzing(true);
    try {
      const res = await runAnalysis({ data: { userId, storeUrl: shopUrlInput.trim() } });
      const newRow: Analysis = {
        id: res.id!,
        store_url: shopUrlInput.trim(),
        snapshot: res.snapshot,
        report: res.report,
        created_at: res.createdAt ?? new Date().toISOString(),
        next_refresh_at: null,
      };
      setAnalyses((prev) => [newRow, ...prev]);
      // Refresh updates feed
      const ws = await fetchWorkspace({ data: { userId } });
      setUpdates(ws.updates);
      setCustomer(ws.customer);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "تعذّر التحليل");
    } finally {
      setAnalyzing(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="h-5 w-5 animate-pulse text-primary" />
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-4 font-bold">{error}</p>
          <button onClick={signOut} className="mt-4 text-sm text-muted-foreground underline-offset-2 hover:underline">
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  const days = daysLeft(customer?.subscription_end ?? null);
  const latest = analyses[0];

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-primary">المسوق الذكي</span>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-2xl font-bold md:text-3xl">
            أهلاً، {customer?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">هذي مساحة عملك — كل شيء موثّق هنا بشفافية كاملة.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 grid gap-4 sm:grid-cols-3"
        >
          <StatCard
            icon={<CalendarDays className="h-5 w-5 text-primary" />}
            label="بداية الاشتراك"
            value={customer?.subscription_start ? formatDate(customer.subscription_start) : "—"}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-gold" />}
            label="الأيام المتبقية"
            value={days !== null ? `${days} يوم` : "—"}
            highlight={days !== null && days <= 5}
          />
          <StatCard
            icon={<Store className="h-5 w-5 text-success" />}
            label="متجرك"
            value={customer?.shop_name ?? customer?.shop_url ?? "لم يُحدَّد بعد"}
            small
          />
        </motion.div>

        {/* Analyzer section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">تحليل متجرك</h2>
              <p className="text-sm text-muted-foreground">
                {latest ? "آخر تحليل + إمكانية تشغيل تحليل جديد" : "ابدأ بتحليل متجرك الآن"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              dir="ltr"
              value={shopUrlInput}
              onChange={(e) => setShopUrlInput(e.target.value)}
              placeholder="https://yourstore.com"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !shopUrlInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحليل (قد يأخذ دقيقة)...
                </>
              ) : latest ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  تحليل جديد
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  حلّل الآن
                </>
              )}
            </button>
          </div>

          {analyzeError && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {analyzeError}
            </div>
          )}

          {latest && (
            <div className="mt-6">
              <AnalysisCard analysis={latest} tier="paid" />
              {analyses.length > 1 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-bold text-muted-foreground hover:text-primary">
                    التحليلات السابقة ({analyses.length - 1})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {analyses.slice(1).map((a) => (
                      <AnalysisCard key={a.id} analysis={a} tier="paid" compact />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </motion.section>

        {/* Updates feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10"
        >
          <h2 className="mb-5 font-display text-lg font-bold">سجل العمل</h2>

          {updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center text-muted-foreground">
              <Clock className="mx-auto mb-3 h-8 w-8 opacity-40" />
              سيظهر هنا كل تحديث فور اكتماله
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className={`flex gap-4 rounded-2xl border p-5 ${
                    u.done ? "border-success/20 bg-success/5" : "border-border bg-card"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {u.done
                      ? <CheckCircle2 className="h-5 w-5 text-success" />
                      : (TYPE_ICON[u.type] ?? <Clock className="h-5 w-5 text-muted-foreground" />)
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-snug">{u.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(u.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{u.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          أي سؤال؟ راسلنا على{" "}
          <a href="mailto:contact@justlator.tech" className="underline-offset-2 hover:underline">
            contact@justlator.tech
          </a>
        </p>
      </main>
    </div>
  );
}

function AnalysisCard({ analysis, tier, compact }: { analysis: Analysis; tier: "free" | "paid"; compact?: boolean }) {
  const { report, snapshot, created_at } = analysis;
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{snapshot.title || analysis.store_url}</p>
          <p className="text-xs text-muted-foreground">{formatDate(created_at)}</p>
        </div>
        <button
          onClick={() => printStoreReport({ snapshot, report, createdAt: created_at, tier })}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>

      {!compact && (
        <>
          <p className="mt-3 rounded-lg bg-primary/5 px-4 py-3 text-sm leading-relaxed">
            {report.summary}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ReportList title="💪 نقاط قوة" items={report.strengths} color="text-success" />
            <ReportList title="⚠️ نقاط ضعف" items={report.weaknesses} color="text-destructive" />
            <ReportList title="🚀 فرص" items={report.opportunities} color="text-gold" />
            <div>
              <h4 className="mb-2 text-sm font-bold text-primary">✅ توصيات</h4>
              <div className="space-y-2">
                {report.recommendations.slice(0, 4).map((r, i) => (
                  <div key={i} className="rounded-lg border border-border p-2.5">
                    <p className="text-sm font-bold">{r.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {report.competitors && report.competitors.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-bold text-purple-600">🎯 منافسون</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {report.competitors.map((c, i) => (
                  <div key={i} className="rounded-lg bg-purple-500/5 px-3 py-2 text-xs">
                    <strong className="block">{c.name}</strong>
                    <span className="text-muted-foreground">{c.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {report.contentPlan && report.contentPlan.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-cyan-700 dark:text-cyan-400">
                <FileText className="h-4 w-4" />
                خطة محتوى {report.contentPlan.length} يوم — تفاعلية
              </h4>
              <ContentPlanView
                contentPlan={report.contentPlan}
                shopType={snapshot.title || "المتجر"}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportList({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className={`mb-2 text-sm font-bold ${color}`}>{title}</h4>
      <ul className="space-y-1.5 text-xs">
        {items.slice(0, 5).map((it, i) => (
          <li key={i} className="rounded bg-muted/40 px-3 py-2">{it}</li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({
  icon, label, value, highlight, small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-gold/40 bg-gold/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`mt-2 font-bold ${small ? "text-sm" : "text-xl"} ${highlight ? "text-gold" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
