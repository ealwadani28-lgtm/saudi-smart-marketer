import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Plus, Loader2, ExternalLink, Lock } from "lucide-react";
import {
  adminAddKpiEntry,
  adminListKpiEntries,
  aggregateKpis,
  type KpiEntry,
} from "@/lib/kpi.functions";

const SOURCES: Array<{ value: string; label: string }> = [
  { value: "meta_ads", label: "Meta Ads" },
  { value: "tiktok_ads", label: "TikTok Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "snapchat_ads", label: "Snapchat Ads" },
  { value: "x_ads", label: "X Ads" },
  { value: "ga4", label: "Google Analytics 4" },
  { value: "search_console", label: "Search Console" },
  { value: "shopify", label: "Shopify" },
  { value: "salla", label: "سلة" },
  { value: "zid", label: "زد" },
  { value: "manual_dashboard", label: "لوحة المعلن" },
];

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

type Props = { token: string; email: string };

export function AdminKpiEntry({ token, email }: Props) {
  const add = useServerFn(adminAddKpiEntry);
  const list = useServerFn(adminListKpiEntries);

  const [entries, setEntries] = useState<KpiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    periodStart: todayISO(-7),
    periodEnd: todayISO(),
    channel: "all",
    source: "meta_ads",
    views: "",
    clicks: "",
    conversions: "",
    costSar: "",
    evidenceUrl: "",
    notes: "",
  });

  const reload = () => {
    setLoading(true);
    list({ data: { token, email } })
      .then((r) => setEntries(r.entries))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [token, email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setOk(""); setSubmitting(true);
    try {
      await add({
        data: {
          token,
          email,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          channel: form.channel.trim() || "all",
          source: form.source as never,
          views: parseInt(form.views || "0", 10),
          clicks: parseInt(form.clicks || "0", 10),
          conversions: parseInt(form.conversions || "0", 10),
          costSar: parseFloat(form.costSar || "0"),
          evidenceUrl: form.evidenceUrl.trim(),
          notes: form.notes.trim() || null,
        },
      });
      setOk("تم الإدخال وختمه ببصمة غير قابلة للتعديل.");
      setForm({ ...form, views: "", clicks: "", conversions: "", costSar: "", evidenceUrl: "", notes: "" });
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  const agg = aggregateKpis(entries);

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  const label = "text-xs font-bold text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          إدخال KPIs (Append-only • مختوم بـ SHA-256)
        </h3>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> لا يمكن التعديل أو الحذف بعد الحفظ
        </span>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className={label}>من تاريخ</label>
          <input type="date" required className={input} value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
        </div>
        <div>
          <label className={label}>إلى تاريخ</label>
          <input type="date" required className={input} value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
        </div>
        <div>
          <label className={label}>القناة</label>
          <input type="text" className={input} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} placeholder="all / TikTok / Snap" />
        </div>
        <div>
          <label className={label}>المصدر (إجباري)</label>
          <select required className={input} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label className={label}>مشاهدات</label>
          <input type="number" min={0} required className={input} value={form.views} onChange={(e) => setForm({ ...form, views: e.target.value })} />
        </div>
        <div>
          <label className={label}>نقرات</label>
          <input type="number" min={0} required className={input} value={form.clicks} onChange={(e) => setForm({ ...form, clicks: e.target.value })} />
        </div>
        <div>
          <label className={label}>تحويلات</label>
          <input type="number" min={0} required className={input} value={form.conversions} onChange={(e) => setForm({ ...form, conversions: e.target.value })} />
        </div>
        <div>
          <label className={label}>التكلفة (ر.س)</label>
          <input type="number" step="0.01" min={0} required className={input} value={form.costSar} onChange={(e) => setForm({ ...form, costSar: e.target.value })} />
        </div>

        <div className="col-span-2 md:col-span-3">
          <label className={label}>رابط الإثبات (لقطة من لوحة المنصة) — إجباري</label>
          <input type="url" required placeholder="https://..." className={input} value={form.evidenceUrl} onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })} />
        </div>
        <div>
          <label className={label}>ملاحظات</label>
          <input type="text" maxLength={500} className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="col-span-2 md:col-span-4 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {err && <span className="text-destructive">{err}</span>}
            {ok && <span className="text-emerald-600">{ok}</span>}
          </div>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            ختم وحفظ
          </button>
        </div>
      </form>

      <div className="mt-5 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <Stat label="مشاهدات" value={agg.views.toLocaleString("ar-SA")} />
        <Stat label="نقرات" value={`${agg.clicks.toLocaleString("ar-SA")} (CTR ${agg.ctr.toFixed(2)}%)`} />
        <Stat label="تحويلات" value={`${agg.conversions.toLocaleString("ar-SA")} (CVR ${agg.cvr.toFixed(2)}%)`} />
        <Stat label="إنفاق" value={`${agg.costSar.toFixed(2)} ر.س`} />
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-bold text-muted-foreground">سجل ({entries.length})</div>
        {loading ? (
          <p className="text-xs text-muted-foreground">جاري التحميل…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا توجد إدخالات بعد.</p>
        ) : (
          <div className="max-h-72 overflow-auto rounded-lg border border-border">
            <table className="w-full text-right text-xs">
              <thead className="sticky top-0 bg-muted/60 text-[10px]">
                <tr>
                  <th className="p-2">الفترة</th>
                  <th className="p-2">المصدر</th>
                  <th className="p-2">مشاهدات</th>
                  <th className="p-2">نقرات</th>
                  <th className="p-2">تحويلات</th>
                  <th className="p-2">تكلفة</th>
                  <th className="p-2">إثبات</th>
                  <th className="p-2">بصمة</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="p-2 whitespace-nowrap">{e.period_start}→{e.period_end}</td>
                    <td className="p-2">{e.source}</td>
                    <td className="p-2">{e.views}</td>
                    <td className="p-2">{e.clicks}</td>
                    <td className="p-2">{e.conversions}</td>
                    <td className="p-2">{Number(e.cost_sar).toFixed(2)}</td>
                    <td className="p-2"><a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" href={e.evidence_url}><ExternalLink className="inline h-3 w-3" /></a></td>
                    <td className="p-2 font-mono text-[10px] text-muted-foreground">{e.entry_hash.slice(0, 8)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
