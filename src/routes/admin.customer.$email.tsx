import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowRight, Loader2, Lock, Store, CalendarDays, AlertCircle,
  CheckCircle2, Sparkles, ChevronRight, ShieldCheck, ExternalLink,
  RefreshCw,
} from "lucide-react";
import { adminAnalyzeCustomerStore, adminGetCustomerView } from "@/lib/admin.functions";

const TOKEN_KEY = "admin_token_v2";

export const Route = createFileRoute("/admin/customer/$email")({
  head: () => ({
    meta: [
      { title: "عرض عميل — لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCustomerView,
});

type Customer = {
  id: string;
  full_name: string;
  email: string;
  shop_url: string | null;
  shop_name: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  status: string;
  created_at: string;
};

type Update = {
  id: string;
  type: string;
  title: string;
  body: string;
  done: boolean;
  created_at: string;
};

type Analysis = {
  id: string;
  store_url: string;
  snapshot: Record<string, unknown> | null;
  report: Record<string, unknown> | null;
  created_at: string;
  next_refresh_at: string | null;
};

type Competitor = {
  id: string;
  competitor_url: string;
  competitor_name: string | null;
  source: string;
  active: boolean;
  last_checked_at: string | null;
  next_check_at: string;
  created_at: string;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  welcome:  <Sparkles className="h-4 w-4 text-primary" />,
  analysis: <Store className="h-4 w-4 text-amber-500" />,
  plan:     <CalendarDays className="h-4 w-4 text-emerald-500" />,
  post:     <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  report:   <ChevronRight className="h-4 w-4 text-primary" />,
  alert:    <AlertCircle className="h-4 w-4 text-destructive" />,
  competitor: <ShieldCheck className="h-4 w-4 text-blue-500" />,
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-SA", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function AdminCustomerView() {
  const { email: rawEmail } = Route.useParams();
  const email = decodeURIComponent(rawEmail);
  const getView = useServerFn(adminGetCustomerView);
  const runAdminAnalysis = useServerFn(adminAnalyzeCustomerStore);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [tab, setTab] = useState<"updates" | "analyses" | "competitors">("updates");
  const [shopUrlInput, setShopUrlInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || "";
    if (!token) {
      setError("الرجاء تسجيل الدخول كأدمن أولاً من /admin");
      setLoading(false);
      return;
    }
    setToken(token);
    getView({ data: { token, email } })
      .then((res) => {
        const customer = res.customer as Customer;
        setCustomer(customer);
        setUpdates(res.updates as Update[]);
        setAnalyses(res.analyses as Analysis[]);
        setCompetitors(res.competitors as Competitor[]);
        setShopUrlInput(customer.shop_url ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "فشل تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [email, getView]);

  async function handleAdminAnalyze() {
    if (!token || !shopUrlInput.trim()) return;
    setAnalyzeError("");
    setAnalyzing(true);
    try {
      const res = await runAdminAnalysis({ data: { token, email, storeUrl: shopUrlInput.trim() } });
      const newRow: Analysis = {
        id: res.id!,
        store_url: shopUrlInput.trim(),
        snapshot: res.snapshot as Record<string, unknown>,
        report: res.report as Record<string, unknown>,
        created_at: res.createdAt ?? new Date().toISOString(),
        next_refresh_at: null,
      };
      setAnalyses((prev) => [newRow, ...prev]);
      const analyzedTitle = typeof newRow.snapshot?.title === "string" ? newRow.snapshot.title : null;
      setCustomer((prev) => prev ? { ...prev, shop_url: shopUrlInput.trim(), shop_name: analyzedTitle || prev.shop_name } : prev);
      setTab("analyses");
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "تعذّر التحليل");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6" dir="rtl">
        <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="mb-4 text-sm text-destructive">{error ?? "غير موجود"}</p>
          <Link to="/admin" className="text-sm text-primary hover:underline">
            ← رجوع للوحة الأدمن
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12" dir="rtl">
      {/* Admin banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-900 dark:text-amber-300">
        <ShieldCheck className="inline h-3.5 w-3.5 ml-1" />
        وضع الأدمن — إدارة مساحة العميل مباشرة بدون تسجيل كعميل أو رمز مؤقت
      </div>

      <header className="border-b border-border bg-card/50 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" /> لوحة الأدمن
          </Link>
          <div className="text-left">
            <h1 className="text-lg font-bold">{customer.full_name}</h1>
            <p className="text-xs text-muted-foreground" dir="ltr">{customer.email}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4">
        {/* Customer card */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">معلومات الاشتراك</h2>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <Info label="المتجر" value={customer.shop_name ?? "—"} />
            <Info label="الرابط" value={
              customer.shop_url ? (
                <a href={customer.shop_url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-primary hover:underline" dir="ltr">
                  {customer.shop_url} <ExternalLink className="h-3 w-3" />
                </a>
              ) : "—"
            } />
            <Info label="الحالة" value={
              <span className={`rounded-md px-2 py-0.5 text-xs ${
                customer.status === "active" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
              }`}>{customer.status}</span>
            } />
            <Info label="ينتهي" value={fmt(customer.subscription_end)} />
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <TabBtn active={tab === "updates"} onClick={() => setTab("updates")}>
            التحديثات ({updates.length})
          </TabBtn>
          <TabBtn active={tab === "analyses"} onClick={() => setTab("analyses")}>
            التحليلات ({analyses.length})
          </TabBtn>
          <TabBtn active={tab === "competitors"} onClick={() => setTab("competitors")}>
            المنافسون ({competitors.length})
          </TabBtn>
        </div>

        {tab === "updates" && (
          <section className="space-y-2">
            {updates.length === 0 ? <Empty text="لا توجد تحديثات بعد" /> : updates.map((u) => (
              <div key={u.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <div className="mt-0.5">{TYPE_ICON[u.type] ?? <Sparkles className="h-4 w-4" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{u.title}</h3>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{fmt(u.created_at)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{u.body}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{u.type}</span>
                    {u.done && <span className="text-emerald-600">✓ مكتمل</span>}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === "analyses" && (
          <section className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  dir="ltr"
                  value={shopUrlInput}
                  onChange={(e) => setShopUrlInput(e.target.value)}
                  placeholder="https://yourstore.com"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <button
                  onClick={handleAdminAnalyze}
                  disabled={analyzing || !shopUrlInput.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {analyzing ? "جاري التحليل..." : "حلّل كأدمن"}
                </button>
              </div>
              {analyzeError && <p className="mt-2 text-xs text-destructive">{analyzeError}</p>}
            </div>
            {analyses.length === 0 ? <Empty text="لا توجد تحليلات بعد" /> : analyses.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <a href={a.store_url} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" dir="ltr">
                    {a.store_url} <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-xs text-muted-foreground">{fmt(a.created_at)}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  التحديث القادم: {fmt(a.next_refresh_at)}
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-primary">عرض JSON كامل</summary>
                  <pre className="mt-2 max-h-96 overflow-auto rounded bg-muted/50 p-2 text-[10px]" dir="ltr">
                    {JSON.stringify({ snapshot: a.snapshot, report: a.report }, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </section>
        )}

        {tab === "competitors" && (
          <section className="space-y-2">
            {competitors.length === 0 ? <Empty text="لا يوجد منافسون بعد" /> : competitors.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.competitor_name ?? c.competitor_url}</div>
                  <a href={c.competitor_url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-muted-foreground hover:text-primary" dir="ltr">
                    {c.competitor_url}
                  </a>
                </div>
                <div className="shrink-0 text-left text-[11px] text-muted-foreground">
                  <div>المصدر: {c.source}</div>
                  <div>آخر فحص: {fmt(c.last_checked_at)}</div>
                  <div>الفحص القادم: {fmt(c.next_check_at)}</div>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] ${
                  c.active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                }`}>{c.active ? "نشط" : "متوقف"}</span>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
        active ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
