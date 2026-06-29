import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Lock, Download, RefreshCw, Users, Mail, ExternalLink, LogOut,
  AlertTriangle, ShieldCheck, Activity, CreditCard, Check, X, MessageCircle,
  FileDown, FileText, Trash2,
} from "lucide-react";
import { adminListSignups, adminLogin, adminListCustomers, adminDeleteCustomer } from "@/lib/admin.functions";
import { adminGetAlerts, adminResolveAlert, adminGetSignupAttempts } from "@/lib/telemetry.functions";
import {
  adminListSubscriptionRequests,
  adminUpdateSubscriptionStatus,
  adminDeleteSubscriptionRequest,
} from "@/lib/subscription.functions";
import { activateCustomer } from "@/lib/customer.functions";
import { adminGetProofUrl } from "@/lib/payment-verify.functions";

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
const RETURN_TO_KEY = "admin_return_to";

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

type SubRequest = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  payment_method: "bank" | "paypal";
  reference: string | null;
  notes: string | null;
  amount_sar: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  proof_path?: string | null;
  extracted_amount?: number | null;
  extracted_currency?: string | null;
  extracted_payee?: string | null;
  extracted_reference?: string | null;
  extracted_date?: string | null;
  verification_status?: "pending" | "auto_verified" | "needs_review" | "rejected" | null;
  verification_notes?: string | null;
  verified_at?: string | null;
};


function AdminPage() {
  const listFn = useServerFn(adminListSignups);
  const loginFn = useServerFn(adminLogin);
  const alertsFn = useServerFn(adminGetAlerts);
  const resolveFn = useServerFn(adminResolveAlert);
  const attemptsFn = useServerFn(adminGetSignupAttempts);
  const listSubsFn = useServerFn(adminListSubscriptionRequests);
  const updateSubFn = useServerFn(adminUpdateSubscriptionStatus);
  const deleteSubFn = useServerFn(adminDeleteSubscriptionRequest);
  const deleteCustomerFn = useServerFn(adminDeleteCustomer);
  const activateFn = useServerFn(activateCustomer);
  const listCustomersFn = useServerFn(adminListCustomers);
  const proofUrlFn = useServerFn(adminGetProofUrl);

  async function viewProof(path: string) {
    if (!token) return;
    try {
      const res = await proofUrlFn({ data: { token, path } });
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(e instanceof Error ? e.message : "تعذّر فتح الإيصال");
    }
  }

  function openCustomerView(email: string) {
    window.location.assign(`/admin/customer/${encodeURIComponent(email)}`);
  }

  const [activating, setActivating] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signups, setSignups] = useState<Signup[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [attemptStats, setAttemptStats] = useState<AttemptStats | null>(null);
  const [subRequests, setSubRequests] = useState<SubRequest[]>([]);
  const [customers, setCustomers] = useState<Array<{
    id: string; full_name: string; email: string; shop_url: string | null;
    shop_name: string | null; status: string;
    subscription_start: string | null; subscription_end: string | null; created_at: string;
  }>>([]);

  async function loadAlertsAndStats(tk: string) {
    try {
      const [a, s, r, c] = await Promise.all([
        alertsFn({ data: { token: tk } }),
        attemptsFn({ data: { token: tk } }),
        listSubsFn({ data: { token: tk } }),
        listCustomersFn({ data: { token: tk } }),
      ]);
      setAlerts(a.alerts as Alert[]);
      setAttemptStats(s.stats);
      setSubRequests(r.requests as SubRequest[]);
      setCustomers(c.customers as typeof customers);
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
      localStorage.setItem(TOKEN_KEY, tk);
      await loadAlertsAndStats(tk);
      const returnTo = sessionStorage.getItem(RETURN_TO_KEY);
      if (returnTo?.startsWith("/admin/customer/")) {
        sessionStorage.removeItem(RETURN_TO_KEY);
        window.location.assign(returnTo);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ غير معروف";
      setError(msg.includes("Unauthorized") ? "انتهت الجلسة، الرجاء تسجيل الدخول مجدداً" : msg);
      setAuthed(false);
      setToken(null);
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
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
    const saved = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (saved) {
      loadWithToken(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
    setToken(null);
    setPassword("");
    setSignups([]);
    setAlerts([]);
    setAttemptStats(null);
    setSubRequests([]);
  }

  async function activateAndSend(requestId: string) {
    if (!token) return;
    setActivating(requestId);
    try {
      const res = await activateFn({ data: { token, subscriptionRequestId: requestId } });
      setSubRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "approved", reviewed_at: new Date().toISOString() }
            : r,
        ),
      );
      alert(`تم تفعيل الحساب وإرسال رابط الدخول إلى ${res.email}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "حدث خطأ أثناء التفعيل");
    } finally {
      setActivating(null);
    }
  }

  async function updateSubStatus(id: string, status: "approved" | "rejected" | "pending") {
    if (!token) return;
    try {
      await updateSubFn({ data: { token, id, status } });
      setSubRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status, reviewed_at: status === "pending" ? null : new Date().toISOString() }
            : r,
        ),
      );
    } catch {
      /* ignore */
    }
  }

  async function deleteSubRequest(id: string, email: string) {
    if (!token) return;
    if (!confirm(`حذف طلب الاشتراك (${email}) نهائيًا؟ لا يمكن التراجع.`)) return;
    try {
      await deleteSubFn({ data: { token, id } });
      setSubRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "فشل الحذف");
    }
  }

  async function deleteCustomerRow(id: string, email: string) {
    if (!token) return;
    if (!confirm(`حذف العميل (${email}) نهائيًا؟ سيتم فقدان بيانات ورك سبيس المرتبطة.`)) return;
    try {
      await deleteCustomerFn({ data: { token, id } });
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "فشل الحذف");
    }
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

  function exportSubsCSV() {
    const header = [
      "id", "full_name", "email", "phone", "payment_method",
      "reference", "amount_sar", "status", "created_at", "reviewed_at", "notes",
    ];
    const rows = subRequests.map((r) =>
      header.map((k) => {
        const v = (r as unknown as Record<string, unknown>)[k] ?? "";
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      }).join(",")
    );
    const csv = "\uFEFF" + [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscription-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadInvoice(r: SubRequest) {
    const date = new Date(r.created_at).toLocaleDateString("ar-SA");
    const invoiceNo = r.id.slice(0, 8).toUpperCase();
    const payment = r.payment_method === "paypal" ? "PayPal" : "تحويل بنكي";
    const amount = r.amount_sar.toLocaleString("ar-SA");
    const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8" />
<title>فاتورة ${invoiceNo} — Justlator</title>
<style>
  *{box-sizing:border-box} body{font-family:-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;color:#0f172a;margin:0;padding:48px;background:#fff}
  .wrap{max-width:720px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;padding:40px}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:20px;margin-bottom:24px}
  .brand{font-size:28px;font-weight:800;letter-spacing:-0.5px}
  .muted{color:#64748b;font-size:13px}
  .meta{text-align:left;font-size:13px;line-height:1.8}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin:24px 0 8px}
  .box{border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#f8fafc}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{text-align:right;padding:12px;border-bottom:1px solid #e2e8f0;font-size:14px}
  th{background:#f1f5f9;font-weight:600}
  .total{display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding:18px 20px;background:#0f172a;color:#fff;border-radius:12px;font-size:18px;font-weight:700}
  .total .amt{font-size:24px}
  .foot{margin-top:32px;font-size:12px;color:#64748b;text-align:center;line-height:1.7}
  @media print{body{padding:0} .wrap{border:none}}
</style></head><body>
<div class="wrap">
  <div class="head">
    <div>
      <div class="brand">Justlator</div>
      <div class="muted">justlator.tech</div>
    </div>
    <div class="meta">
      <div><strong>فاتورة #</strong> ${invoiceNo}</div>
      <div><strong>التاريخ:</strong> ${date}</div>
      <div><strong>الحالة:</strong> ${r.status === "approved" ? "مدفوعة" : r.status === "rejected" ? "ملغاة" : "بانتظار المراجعة"}</div>
    </div>
  </div>

  <h2>بيانات العميل</h2>
  <div class="box">
    <div><strong>الاسم:</strong> ${escapeHtml(r.full_name)}</div>
    <div><strong>البريد:</strong> ${escapeHtml(r.email)}</div>
    ${r.phone ? `<div><strong>الجوال:</strong> ${escapeHtml(r.phone)}</div>` : ""}
  </div>

  <h2>تفاصيل الاشتراك</h2>
  <table>
    <thead><tr><th>الوصف</th><th>طريقة الدفع</th><th>المبلغ</th></tr></thead>
    <tbody>
      <tr>
        <td>اشتراك Justlator الشهري</td>
        <td>${payment}</td>
        <td><strong>${amount} ر.س</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="total">
    <span>الإجمالي المستحق</span>
    <span class="amt">${amount} ريال سعودي</span>
  </div>

  ${r.reference ? `<p class="muted" style="margin-top:16px"><strong>رقم العملية:</strong> ${escapeHtml(r.reference)}</p>` : ""}

  <div class="foot">
    شكراً لاشتراكك في Justlator. لأي استفسار راسلنا على contact@justlator.tech
  </div>
</div>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }


  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6" dir="rtl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!password.trim()) {
              setError("الرجاء إدخال كلمة المرور");
              return;
            }
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
            disabled={loading}
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
            <Link
              to="/admin/domains"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:bg-accent"
            >
              <ShieldCheck className="h-4 w-4" />
              فحص الدومينات
            </Link>
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

        {/* Subscription Requests */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">طلبات الاشتراك</h2>
              {subRequests.filter((r) => r.status === "pending").length > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  {subRequests.filter((r) => r.status === "pending").length} بانتظار المراجعة
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">إجمالي: {subRequests.length}</span>
              <button
                onClick={exportSubsCSV}
                disabled={subRequests.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-accent disabled:opacity-50"
              >
                <FileDown className="h-3.5 w-3.5" />
                تصدير CSV
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 font-medium">العميل</th>
                    <th className="px-4 py-3 font-medium">الدفع</th>
                    <th className="px-4 py-3 font-medium">المرجع</th>
                    <th className="px-4 py-3 font-medium">التاريخ</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {subRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        لا توجد طلبات اشتراك بعد
                      </td>
                    </tr>
                  ) : (
                    subRequests.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border last:border-0 transition hover:bg-muted/20"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.full_name}</div>
                          <a
                            href={`mailto:${r.email}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {r.email}
                          </a>
                          {r.phone && (
                            <div className="text-xs text-muted-foreground" dir="ltr">
                              {r.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                              r.payment_method === "paypal"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {r.payment_method === "paypal" ? "PayPal" : "بنكي"}
                          </span>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {r.amount_sar} ر.س
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">
                          {r.reference || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">
                          {new Date(r.created_at).toLocaleString("ar-SA")}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {r.phone && (
                              <a
                                href={`https://wa.me/${normalizePhone(r.phone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="grid h-7 w-7 place-items-center rounded-md bg-[#25D366]/15 text-[#128C4E] transition hover:bg-[#25D366]/25"
                                title="واتساب"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => downloadInvoice(r)}
                              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/20"
                              title="فاتورة PDF"
                            >
                              <FileText className="h-3 w-3" /> فاتورة
                            </button>
                            {r.status !== "approved" && (
                              <button
                                onClick={() => activateAndSend(r.id)}
                                disabled={activating === r.id}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/25 dark:text-emerald-400 disabled:opacity-50"
                                title="تفعيل وإرسال رابط الدخول"
                              >
                                <Check className="h-3 w-3" />
                                {activating === r.id ? "جاري..." : "فعّل + أرسل"}
                              </button>
                            )}
                            {r.status === "approved" && (
                              <button
                                onClick={() => openCustomerView(r.email)}
                                className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/25"
                                title="فتح ورك سبيس العميل من لوحة الأدمن بدون تسجيل عميل"
                              >
                                <ExternalLink className="h-3 w-3" /> ورك سبيس
                              </button>
                            )}
                            {r.status !== "rejected" && (
                              <button
                                onClick={() => updateSubStatus(r.id, "rejected")}
                                className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/25"
                                title="رفض"
                              >
                                <X className="h-3 w-3" /> ارفض
                              </button>
                            )}
                            <button
                              onClick={() => deleteSubRequest(r.id, r.email)}
                              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/20"
                              title="حذف الطلب نهائيًا"
                            >
                              <Trash2 className="h-3 w-3" /> احذف
                            </button>
                          </div>
                          {r.verification_status && r.verification_status !== "pending" && (
                            <div className="mt-1.5 space-y-0.5">
                              <div
                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  r.verification_status === "auto_verified"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : r.verification_status === "needs_review"
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                      : "bg-destructive/15 text-destructive"
                                }`}
                              >
                                {r.verification_status === "auto_verified"
                                  ? "✓ تحقق تلقائي"
                                  : r.verification_status === "needs_review"
                                    ? "⚠ مراجعة يدوية"
                                    : "✕ مرفوض"}
                              </div>
                              {(r.extracted_amount || r.extracted_payee) && (
                                <div className="text-[10px] text-muted-foreground">
                                  {r.extracted_amount} {r.extracted_currency || ""} —{" "}
                                  {r.extracted_payee || "—"}
                                </div>
                              )}
                              {r.proof_path && (
                                <button
                                  onClick={() => viewProof(r.proof_path!)}
                                  className="text-[10px] text-primary hover:underline"
                                >
                                  📎 عرض الإيصال
                                </button>
                              )}
                              {r.verification_notes && (
                                <div
                                  className="max-w-[220px] truncate text-[10px] text-muted-foreground"
                                  title={r.verification_notes}
                                >
                                  {r.verification_notes}
                                </div>
                              )}
                            </div>
                          )}
                          {r.notes && (
                            <div
                              className="mt-1 max-w-[220px] truncate text-[11px] text-muted-foreground"
                              title={r.notes}
                            >
                              📝 {r.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Customers (active workspaces) */}
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">العملاء (ورك سبيس)</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {customers.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 font-medium">العميل</th>
                    <th className="px-4 py-3 font-medium">المتجر</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">انتهاء الاشتراك</th>
                    <th className="px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        لا يوجد عملاء بعد
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 transition hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium">{c.full_name}</div>
                          <a href={`mailto:${c.email}`} className="text-xs text-primary hover:underline">{c.email}</a>
                        </td>
                        <td className="px-4 py-3">
                          {c.shop_url ? (
                            <a
                              href={c.shop_url.startsWith("http") ? c.shop_url : `https://${c.shop_url}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              {truncate(c.shop_name || c.shop_url, 30)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            c.status === "active"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {c.status === "active" ? "مفعّل" : c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">
                          {c.subscription_end ? new Date(c.subscription_end).toLocaleDateString("ar-SA") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => openCustomerView(c.email)}
                              className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/25"
                            >
                              <ExternalLink className="h-3 w-3" /> ورك سبيس
                            </button>
                            <button
                              onClick={() => deleteCustomerRow(c.id, c.email)}
                              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/20"
                              title="حذف العميل نهائيًا"
                            >
                              <Trash2 className="h-3 w-3" /> احذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePhone(p: string) {
  const digits = p.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "966" + digits.slice(1);
  return digits;
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { label: "بانتظار المراجعة", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    approved: { label: "مفعّل", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    rejected: { label: "مرفوض", cls: "bg-destructive/15 text-destructive" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
