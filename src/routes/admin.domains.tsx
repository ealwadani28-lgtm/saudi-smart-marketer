import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Shield, RefreshCw, Plus, Trash2, ArrowRight, ExternalLink, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import {
  adminListMonitoredDomains,
  adminAddMonitoredDomain,
  adminRemoveMonitoredDomain,
  adminListDomainScans,
  adminRunDomainScan,
} from "@/lib/domain-scan.functions";

export const Route = createFileRoute("/admin.domains")({
  head: () => ({
    meta: [
      { title: "فحص الدومينات — المسوق الذكي" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDomainsPage,
});

const TOKEN_KEY = "admin_token_v2";

type MonitoredDomain = { id: string; domain: string; label: string | null; created_at: string };
type DomainScan = {
  id: string;
  domain_id: string;
  domain: string;
  source: string;
  status: string;
  grade: string | null;
  has_warnings: boolean | null;
  cert_subject: string | null;
  cert_issuer: string | null;
  cert_valid_from: string | null;
  cert_valid_to: string | null;
  protocols: string[] | null;
  error: string | null;
  started_at: string;
  completed_at: string | null;
};

function gradeColor(grade: string | null): string {
  if (!grade) return "bg-zinc-700 text-zinc-300";
  if (grade.startsWith("A")) return "bg-emerald-600 text-white";
  if (grade.startsWith("B")) return "bg-lime-600 text-white";
  if (grade.startsWith("C")) return "bg-yellow-600 text-white";
  if (grade.startsWith("D") || grade.startsWith("E")) return "bg-orange-600 text-white";
  return "bg-red-600 text-white";
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return s;
  }
}

function AdminDomainsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [scans, setScans] = useState<DomainScan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const listDomains = useServerFn(adminListMonitoredDomains);
  const addDomain = useServerFn(adminAddMonitoredDomain);
  const removeDomain = useServerFn(adminRemoveMonitoredDomain);
  const listScans = useServerFn(adminListDomainScans);
  const runScan = useServerFn(adminRunDomainScan);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    setToken(t);
  }, []);

  async function refresh(tok: string, domainId?: string) {
    setLoading(true);
    setErr(null);
    try {
      const [d, s] = await Promise.all([
        listDomains({ data: { token: tok } }),
        listScans({ data: { token: tok, domainId, limit: 50 } }),
      ]);
      setDomains(d.domains);
      setScans(s.scans as DomainScan[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطأ في التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) refresh(token, selected ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selected]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErr(null);
    try {
      await addDomain({ data: { token, domain: newDomain.trim(), label: newLabel.trim() || null } });
      setNewDomain("");
      setNewLabel("");
      await refresh(token, selected ?? undefined);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذّرت الإضافة");
    }
  }

  async function handleRemove(id: string) {
    if (!token) return;
    if (!confirm("حذف الدومين وكل سجلات فحوصاته؟")) return;
    try {
      await removeDomain({ data: { token, id } });
      if (selected === id) setSelected(null);
      await refresh(token, selected ?? undefined);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذّر الحذف");
    }
  }

  async function handleRun(id: string) {
    if (!token) return;
    setRunning(id);
    setErr(null);
    try {
      await runScan({ data: { token, id } });
      await refresh(token, selected ?? undefined);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل الفحص");
    } finally {
      setRunning(null);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 mx-auto text-zinc-500" />
          <p>يجب تسجيل الدخول من <Link to="/admin" className="text-blue-400 underline">لوحة الأدمن</Link> أولاً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" dir="rtl">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h1 className="text-lg font-bold">فحص الدومينات (SSL Labs)</h1>
          </div>
          <Link to="/admin" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
            <ArrowRight className="w-4 h-4" />
            رجوع للوحة الأدمن
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {err && (
          <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg p-3 text-sm">
            {err}
          </div>
        )}

        {/* Add domain */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة دومين للمراقبة
          </h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              required
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              dir="ltr"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="تسمية اختيارية (مثال: الموقع الرسمي)"
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              إضافة
            </button>
          </form>
        </section>

        {/* Domains list */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold">الدومينات ({domains.length})</h2>
            <button
              onClick={() => token && refresh(token, selected ?? undefined)}
              className="text-zinc-400 hover:text-white text-sm flex items-center gap-1"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث
            </button>
          </div>
          {domains.length === 0 ? (
            <p className="p-6 text-center text-zinc-500 text-sm">لا يوجد دومينات بعد — أضف أول دومين أعلاه.</p>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {domains.map((d) => (
                <li
                  key={d.id}
                  className={`p-4 flex items-center justify-between gap-3 hover:bg-zinc-800/40 cursor-pointer ${selected === d.id ? "bg-zinc-800/60" : ""}`}
                  onClick={() => setSelected(selected === d.id ? null : d.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-emerald-300" dir="ltr">{d.domain}</div>
                    {d.label && <div className="text-xs text-zinc-400 mt-0.5">{d.label}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(d.domain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-zinc-400 hover:text-white p-2"
                      title="افتح في SSL Labs"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRun(d.id); }}
                      disabled={running === d.id}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1"
                    >
                      {running === d.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> جارٍ الفحص…</>
                      ) : (
                        <>تشغيل فحص جديد</>
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(d.id); }}
                      className="text-red-400 hover:text-red-300 p-2"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {running && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-sm text-blue-200 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            الفحص قيد التشغيل عبر SSL Labs، قد يستغرق حتى دقيقتين… لا تُغلق الصفحة.
          </div>
        )}

        {/* Scans table */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold">
              سجل الفحوصات {selected ? `— ${domains.find(d => d.id === selected)?.domain}` : "(كل الدومينات)"}
            </h2>
            {selected && (
              <button onClick={() => setSelected(null)} className="text-xs text-zinc-400 hover:text-white">
                عرض الكل
              </button>
            )}
          </div>
          {scans.length === 0 ? (
            <p className="p-6 text-center text-zinc-500 text-sm">لا توجد فحوصات بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950 text-xs text-zinc-400 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-right">الدومين</th>
                    <th className="px-3 py-2 text-right">الدرجة</th>
                    <th className="px-3 py-2 text-right">المُصدِر</th>
                    <th className="px-3 py-2 text-right">تنتهي في</th>
                    <th className="px-3 py-2 text-right">البروتوكولات</th>
                    <th className="px-3 py-2 text-right">تاريخ الفحص</th>
                    <th className="px-3 py-2 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {scans.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-800/30">
                      <td className="px-3 py-2 font-mono text-xs text-emerald-300" dir="ltr">{s.domain}</td>
                      <td className="px-3 py-2">
                        {s.grade ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${gradeColor(s.grade)}`}>
                            {s.grade}
                          </span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-300 max-w-[180px] truncate" title={s.cert_issuer ?? ""}>
                        {s.cert_issuer ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-300">{fmtDate(s.cert_valid_to)}</td>
                      <td className="px-3 py-2 text-xs text-zinc-300">
                        {s.protocols && s.protocols.length > 0 ? s.protocols.join(", ") : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-400 whitespace-nowrap">{fmtDate(s.started_at)}</td>
                      <td className="px-3 py-2">
                        {s.status === "ready" && (
                          <span className="text-emerald-400 flex items-center gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3" /> مكتمل
                          </span>
                        )}
                        {s.status === "error" && (
                          <span className="text-red-400 flex items-center gap-1 text-xs" title={s.error ?? ""}>
                            <AlertTriangle className="w-3 h-3" /> فشل
                          </span>
                        )}
                        {(s.status === "running" || s.status === "pending") && (
                          <span className="text-blue-400 flex items-center gap-1 text-xs">
                            <Loader2 className="w-3 h-3 animate-spin" /> {s.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
