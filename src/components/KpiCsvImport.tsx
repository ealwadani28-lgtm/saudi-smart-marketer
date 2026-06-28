import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, FileSpreadsheet, AlertTriangle, CheckCircle2, Fingerprint } from "lucide-react";
import { adminBulkImportKpi } from "@/lib/kpi.functions";

const SOURCES: Array<{ value: string; label: string; hint: string }> = [
  { value: "meta_ads", label: "Meta Ads (Facebook/Instagram)", hint: "Ads Manager → Reports → Export → CSV" },
  { value: "google_ads", label: "Google Ads", hint: "Campaigns → Download → .csv (Comma separated)" },
  { value: "tiktok_ads", label: "TikTok Ads", hint: "Reporting → Export → CSV" },
  { value: "snapchat_ads", label: "Snapchat Ads", hint: "Ads Manager → Export CSV" },
  { value: "x_ads", label: "X Ads", hint: "Analytics → Export CSV" },
  { value: "ga4", label: "Google Analytics 4", hint: "Reports → Share → Download CSV" },
  { value: "search_console", label: "Search Console", hint: "Performance → Export → CSV" },
  { value: "shopify", label: "Shopify", hint: "Analytics → Reports → Export" },
  { value: "salla", label: "سلة", hint: "التقارير → تصدير CSV" },
  { value: "zid", label: "زد", hint: "التقارير → تصدير CSV" },
];

type ParsedRow = {
  periodStart: string;
  periodEnd: string;
  channel: string;
  views: number;
  clicks: number;
  conversions: number;
  costSar: number;
};

// alias map: normalized column name → canonical field
const ALIASES: Record<string, keyof ParsedRow> = {
  // dates
  "date": "periodStart",
  "day": "periodStart",
  "reporting_starts": "periodStart",
  "reporting_ends": "periodEnd",
  "start_date": "periodStart",
  "end_date": "periodEnd",
  "اليوم": "periodStart",
  "التاريخ": "periodStart",
  // views/impressions
  "impressions": "views",
  "impr": "views",
  "impr.": "views",
  "views": "views",
  "ظهور": "views",
  "مرات_الظهور": "views",
  "مشاهدات": "views",
  // clicks
  "clicks": "clicks",
  "link_clicks": "clicks",
  "all_clicks": "clicks",
  "نقرات": "clicks",
  "النقرات": "clicks",
  // conversions
  "conversions": "conversions",
  "results": "conversions",
  "purchases": "conversions",
  "orders": "conversions",
  "leads": "conversions",
  "تحويلات": "conversions",
  "طلبات": "conversions",
  "مبيعات": "conversions",
  // spend
  "spend": "costSar",
  "cost": "costSar",
  "amount_spent_sar": "costSar",
  "amount_spent": "costSar",
  "التكلفة": "costSar",
  "الإنفاق": "costSar",
  "تكلفة": "costSar",
  // channel
  "campaign": "channel",
  "campaign_name": "channel",
  "ad_set_name": "channel",
  "channel": "channel",
  "الحملة": "channel",
};

function normalizeKey(k: string) {
  return k
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, "")
    .replace(/\s+/g, "_")
    .replace(/[()]/g, "")
    .replace(/[.\-/]/g, "_");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toNumber(v: string): number {
  if (!v) return 0;
  // strip currency symbols, thousands separators, RTL marks
  const cleaned = v.replace(/[^\d.\-,]/g, "").replace(/,(?=\d{3}\b)/g, "");
  const n = parseFloat(cleaned.replace(/,/g, "."));
  return isFinite(n) ? n : 0;
}

function toIsoDate(v: string): string | null {
  if (!v) return null;
  const t = v.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(t)) return t.replace(/\//g, "-");
  // DD/MM/YYYY or MM/DD/YYYY → use Date.parse cautiously
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10), y = m[3];
    // assume D/M/Y (Saudi/MENA convention)
    const dd = String(a).padStart(2, "0");
    const mm = String(b).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map(normalizeKey);
  const colIndex: Partial<Record<keyof ParsedRow, number>> = {};
  header.forEach((h, i) => {
    const field = ALIASES[h];
    if (field && colIndex[field] === undefined) colIndex[field] = i;
  });

  const out: ParsedRow[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = splitCsvLine(lines[li]);
    const ds = colIndex.periodStart !== undefined ? toIsoDate(cells[colIndex.periodStart] || "") : null;
    const de = colIndex.periodEnd !== undefined ? toIsoDate(cells[colIndex.periodEnd] || "") : ds;
    if (!ds) continue;
    out.push({
      periodStart: ds,
      periodEnd: de || ds,
      channel: (colIndex.channel !== undefined ? cells[colIndex.channel] : "") || "all",
      views: Math.round(toNumber(colIndex.views !== undefined ? cells[colIndex.views] : "0")),
      clicks: Math.round(toNumber(colIndex.clicks !== undefined ? cells[colIndex.clicks] : "0")),
      conversions: Math.round(toNumber(colIndex.conversions !== undefined ? cells[colIndex.conversions] : "0")),
      costSar: toNumber(colIndex.costSar !== undefined ? cells[colIndex.costSar] : "0"),
    });
  }
  return out;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Props = { token: string; email: string; onImported?: () => void };

export function KpiCsvImport({ token, email, onImported }: Props) {
  const bulk = useServerFn(adminBulkImportKpi);
  const [source, setSource] = useState<string>("meta_ads");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function ingestText(text: string, name: string) {
    setRawText(text);
    setFileName(name);
    const hash = await sha256Hex(text);
    setFileHash(hash);
    setRows(parseCsv(text));
    setMsg(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5_000_000) { setMsg({ kind: "err", text: "حجم الملف يتجاوز 5MB" }); return; }
    const text = await f.text();
    await ingestText(text, f.name);
  }

  async function onPasteApply() {
    if (!rawText.trim()) return;
    await ingestText(rawText, fileName || "pasted.csv");
  }

  const summary = useMemo(() => {
    const t = rows.reduce(
      (a, r) => ({
        views: a.views + r.views,
        clicks: a.clicks + r.clicks,
        conversions: a.conversions + r.conversions,
        costSar: a.costSar + r.costSar,
      }),
      { views: 0, clicks: 0, conversions: 0, costSar: 0 },
    );
    return t;
  }, [rows]);

  async function onImport() {
    setMsg(null);
    if (rows.length === 0) { setMsg({ kind: "err", text: "لا توجد سطور قابلة للاستيراد" }); return; }
    if (!evidenceUrl.trim()) { setMsg({ kind: "err", text: "أدخل رابط الإثبات من المنصة" }); return; }
    setBusy(true);
    try {
      const r = await bulk({
        data: {
          token, email,
          source: source as never,
          evidenceUrl: evidenceUrl.trim(),
          fileName: fileName || "import.csv",
          fileHash,
          rows,
        },
      });
      setMsg({ kind: "ok", text: `تم استيراد ${r.inserted} سطر وختمها. بصمة المصدر: ${r.fileHash.slice(0, 16)}…` });
      setRows([]); setRawText(""); setFileName(""); setFileHash("");
      onImported?.();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "فشل الاستيراد" });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  const label = "text-xs font-bold text-muted-foreground";
  const sourceHint = SOURCES.find((s) => s.value === source)?.hint;

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-primary" />
        <h4 className="font-bold">استيراد تلقائي من CSV (Meta / Google / Shopify / سلة / زد)</h4>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        صدّر تقرير الفترة من لوحة المنصة كملف CSV، ارفعه هنا، وسيتم استخراج المشاهدات والنقرات والتحويلات والتكلفة لكل يوم/حملة تلقائياً.
        نقوم بحساب بصمة <b>SHA-256</b> للملف الأصلي وحفظها مع كل سجل كدليل على المصدر الذي تم الاستيراد منه.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className={label}>المصدر</label>
          <select className={input} value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {sourceHint && <div className="mt-1 text-[10px] text-muted-foreground">طريقة التصدير: {sourceHint}</div>}
        </div>
        <div>
          <label className={label}>رابط الإثبات من المنصة (إجباري)</label>
          <input type="url" placeholder="https://..." className={input} value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} />
        </div>
        <div>
          <label className={label}>ملف CSV</label>
          <input type="file" accept=".csv,text/csv" className={input} onChange={onFile} />
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground">…أو الصق محتوى CSV يدوياً</summary>
        <textarea
          rows={4}
          className={`${input} mt-2 font-mono text-[11px]`}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="date,impressions,clicks,results,spend&#10;2026-06-01,12000,420,18,250.50"
        />
        <button type="button" onClick={onPasteApply} className="mt-2 rounded-lg border border-border px-3 py-1 text-xs hover:bg-background">تحليل النص</button>
      </details>

      {rows.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              تم تحليل {rows.length} سطر
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground" title="SHA-256 للملف الأصلي">
              <Fingerprint className="h-3 w-3" /> {fileHash.slice(0, 16)}…
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
            <div className="rounded bg-muted/40 p-2"><b>{summary.views.toLocaleString("ar-SA")}</b> مشاهدة</div>
            <div className="rounded bg-muted/40 p-2"><b>{summary.clicks.toLocaleString("ar-SA")}</b> نقرة</div>
            <div className="rounded bg-muted/40 p-2"><b>{summary.conversions.toLocaleString("ar-SA")}</b> تحويل</div>
            <div className="rounded bg-muted/40 p-2"><b>{summary.costSar.toFixed(2)}</b> ر.س</div>
          </div>
          <div className="mt-2 max-h-40 overflow-auto rounded border border-border">
            <table className="w-full text-right text-[11px]">
              <thead className="sticky top-0 bg-muted/60 text-[10px]"><tr>
                <th className="p-1.5">الفترة</th><th className="p-1.5">القناة</th>
                <th className="p-1.5">ظهور</th><th className="p-1.5">نقرات</th>
                <th className="p-1.5">تحويلات</th><th className="p-1.5">تكلفة</th>
              </tr></thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="p-1.5 whitespace-nowrap">{r.periodStart}{r.periodEnd !== r.periodStart ? ` ← ${r.periodEnd}` : ""}</td>
                    <td className="p-1.5">{r.channel}</td>
                    <td className="p-1.5">{r.views}</td>
                    <td className="p-1.5">{r.clicks}</td>
                    <td className="p-1.5">{r.conversions}</td>
                    <td className="p-1.5">{r.costSar.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && <div className="p-1.5 text-center text-[10px] text-muted-foreground">… و{rows.length - 50} سطر آخر سيُستورد عند التأكيد</div>}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs">
          {msg?.kind === "err" && <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> {msg.text}</span>}
          {msg?.kind === "ok" && <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> {msg.text}</span>}
        </div>
        <button
          type="button"
          disabled={busy || rows.length === 0}
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          ختم واستيراد كل السطور
        </button>
      </div>
    </div>
  );
}
