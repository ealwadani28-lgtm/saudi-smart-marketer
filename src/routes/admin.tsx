import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Lock, Download, RefreshCw, Users, Mail, ExternalLink, LogOut,
  AlertTriangle, ShieldCheck, Activity,
} from "lucide-react";
import { adminListSignups, adminLogin } from "@/lib/admin.functions";
import { adminGetAlerts, adminResolveAlert, adminGetSignupAttempts } from "@/lib/telemetry.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — المسوق الذكي" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Signup = {
  id: string;
  email: string;
  shop_url: string | null;
  source: string;
  created_at: string;
};

const TOKEN_KEY = "admin_token_v2";
const LEGACY_PW_KEY = "admin_pw";

type Alert = {
  id: string;
  kind: string;
  severity: "info" | "warn" | "critical";
  message: string;
  metadata: Record<string, unknown>;
  resolved_at: string | null;
  created_at: string;
};

type AttemptStats = {
  last24h: number;
  last10min: number;
  successLast24h: number;
  rejectedLast24h: number;
};

function AdminPage() {
  const listFn = useServerFn(adminListSignups);
  const loginFn = useServerFn(adminLogin);
  const alertsFn = useServerFn(adminGetAlerts);
  const resolveFn = useServerFn(adminResolveAlert);
  const attemptsFn = useServerFn(adminGetSignupAttempts);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signups, setSignups] = useState<Signup[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [attemptStats, setAttemptStats] = useState<AttemptStats | null>(null);

  async function loadAlertsAndStats(tk: string) {
    try {
      const [a, s] = await Promise.all([
        alertsFn({ data: { token: tk } }),
        attemptsFn({ data: { token: tk } }),
      ]);
      setAlerts(a.alerts as Alert[]);
      setAttemptStats(s.stats);
    } catch {
      // non-fatal
    }
  }

  async function loadWithToken(tk: string) {
    setLoading(true);
    setError("");
    try {
      const res = await listFn({ data: { token: tk } });
      setSignups(res.signups as Signup[]);
      setAuthed(true);
      setToken(tk);
      sessionStorage.setItem(TOKEN_KEY, tk);
      await loadAlertsAndStats(tk);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ غير معروف";
      setError(msg.includes("Unauthorized") ? "انتهت الجلسة، الرجاء تسجيل الدخول مجدداً" : msg);
      setAuthed(false);
      setToken(null);
      sessionStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh alerts every 30s while authed
  useEffect(() => {
    if (!authed || !token) return;
    const id = setInterval(() => loadAlertsAndStats(token), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, token]);

  async function resolveAlert(id: string) {
    if (!token) return;
    try {
      await resolveFn({ data: { token, alertId: id } });
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved_at: new Date().toISOString() } : a)));
    } catch {
      /* ignore */
    }
  }

  async function login(pw: string) {
    setLoading(true);
    setError("");
    try {
      const { token: tk } = await loginFn({ data: { password: pw } });
      await loadWithToken(tk);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ غير معروف";
      setError(msg.includes("كلمة المرور") || msg.includes("Unauthorized") ? "كلمة المرور غير صحيحة" : msg);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Migrate away from the old password-in-sessionStorage scheme.
    sessionStorage.removeItem(LEGACY_PW_KEY);
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) {
      loadWithToken(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
    setToken(null);
    setPassword("");
    setSignups([]);
  }

  function exportCSV() {
    const header = ["id", "email", "shop_url", "source", "created_at"];
    const rows = signups.map((s) =>
      header.map((k) => {
        const v = (s as unknown as Record<string, unknown>)[k] ?? "";
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      }).join(",")
    );
    const csv = "\uFEFF" + [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6" dir="rtl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login(password);
          }}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">لوحة الإدارة</h1>
            <p className="mt-2 text-sm text-muted-foreground">منطقة محمية — أدخل كلمة المرور للوصول</p>
          </div>
          <label className="block text-sm font-medium">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="••••••••"
          />
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "جاري التحقق..." : "دخول"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">لوحة الإدارة</h1>
              <p className="text-xs text-muted-foreground">المسجلين المبكرين</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => token && loadWithToken(token)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
            <button
              onClick={exportCSV}
              disabled={signups.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              تصدير CSV
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {alerts.filter((a) => !a.resolved_at).length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.filter((a) => !a.resolved_at).map((a) => (
              <div
                key={a.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${
                  a.severity === "critical"
                    ? "border-destructive/40 bg-destructive/10"
                    : "border-amber-500/40 bg-amber-500/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`mt-0.5 h-5 w-5 ${a.severity === "critical" ? "text-destructive" : "text-amber-600"}`}
                  />
                  <div>
                    <p className="font-medium">{a.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                      {new Date(a.created_at).toLocaleString("ar-SA")} · {a.kind} · {a.severity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => resolveAlert(a.id)}
                  className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs transition hover:bg-accent"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> تمت المعالجة
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="إجمالي المسجلين" value={signups.length.toString()} icon={<Users className="h-5 w-5" />} />
          <StatCard
            label="اليوم"
            value={signups.filter((s) => isSameDay(new Date(s.created_at), new Date())).length.toString()}
            icon={<Mail className="h-5 w-5" />}
          />
          <StatCard
            label="محاولات (24س)"
            value={attemptStats?.last24h.toString() ?? "—"}
            icon={<Activity className="h-5 w-5" />}
            hint={attemptStats ? `${attemptStats.rejectedLast24h} مرفوضة` : undefined}
          />
          <StatCard
            label="آخر 10 دقائق"
            value={attemptStats?.last10min.toString() ?? "—"}
            icon={<Activity className="h-5 w-5" />}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">البريد</th>
                  <th className="px-4 py-3 font-medium">رابط المتجر</th>
                  <th className="px-4 py-3 font-medium">المصدر</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {signups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      لا يوجد مسجلين بعد
                    </td>
                  </tr>
                ) : (
                  signups.map((s, i) => (
                    <tr key={s.id} className="border-b border-border last:border-0 transition hover:bg-muted/20">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        <a href={`mailto:${s.email}`} className="text-primary hover:underline">{s.email}</a>
                      </td>
                      <td className="px-4 py-3">
                        {s.shop_url ? (
                          <a
                            href={s.shop_url.startsWith("http") ? s.shop_url : `https://${s.shop_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {truncate(s.shop_url, 30)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.source}</td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                        {new Date(s.created_at).toLocaleString("ar-SA")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label, value, icon, hint,
}: { label: string; value: string; icon: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
    </div>
  );
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function daysAgo(d: Date) {
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
