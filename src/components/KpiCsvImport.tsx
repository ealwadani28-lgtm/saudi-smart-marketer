import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, FileSpreadsheet, AlertTriangle, CheckCircle2, Fingerprint, Download, XCircle } from "lucide-react";
import { adminBulkImportKpi } from "@/lib/kpi.functions";

type SourceDef = {
  value: string;
  label: string;
  hint: string;
  /** canonical column order used in the downloadable template */
  templateCols: string[];
  /** 2 sample rows that match the templateCols exactly */
  sampleRows: string[][];
};

const SOURCES: SourceDef[] = [
  {
    value: "meta_ads",
    label: "Meta Ads (Facebook/Instagram)",
    hint: "Ads Manager → Reports → Export → CSV",
    templateCols: ["Reporting starts", "Reporting ends", "Campaign name", "Impressions", "Link clicks", "Results", "Amount spent (SAR)"],
    sampleRows: [
      ["2026-06-01", "2026-06-01", "Summer Sale", "12000", "420", "18", "250.50"],
      ["2026-06-02", "2026-06-02", "Summer Sale", "9800", "310", "14", "210.00"],
    ],
  },
  {
    value: "google_ads",
    label: "Google Ads",
    hint: "Campaigns → Download → .csv (Comma separated)",
    templateCols: ["Day", "Campaign", "Impressions", "Clicks", "Conversions", "Cost"],
    sampleRows: [
      ["2026-06-01", "Brand - Search", "5400", "180", "9", "120.75"],
      ["2026-06-02", "Brand - Search", "6100", "210", "12", "138.20"],
    ],
  },
  {
    value: "tiktok_ads",
    label: "TikTok Ads",
    hint: "Reporting → Export → CSV",
    templateCols: ["Date", "Campaign name", "Impressions", "Clicks", "Conversions", "Cost"],
    sampleRows: [
      ["2026-06-01", "Awareness", "20000", "650", "22", "300.00"],
      ["2026-06-02", "Awareness", "18500", "590", "19", "275.40"],
    ],
  },
  {
    value: "snapchat_ads",
    label: "Snapchat Ads",
    hint: "Ads Manager → Export CSV",
    templateCols: ["Day", "Campaign", "Impressions", "Swipes", "Conversions", "Spend"],
    sampleRows: [
      ["2026-06-01", "Discover", "15000", "400", "11", "180.00"],
      ["2026-06-02", "Discover", "16200", "445", "13", "195.50"],
    ],
  },
  {
    value: "x_ads",
    label: "X Ads",
    hint: "Analytics → Export CSV",
    templateCols: ["Date", "Campaign", "Impressions", "Clicks", "Conversions", "Spend"],
    sampleRows: [
      ["2026-06-01", "Launch", "8000", "240", "7", "95.30"],
      ["2026-06-02", "Launch", "7600", "215", "6", "88.10"],
    ],
  },
  {
    value: "ga4",
    label: "Google Analytics 4",
    hint: "Reports → Share → Download CSV",
    templateCols: ["Date", "Channel", "Views", "Clicks", "Conversions", "Cost"],
    sampleRows: [
      ["2026-06-01", "Organic", "3200", "0", "5", "0"],
      ["2026-06-02", "Paid Search", "1100", "320", "9", "140.00"],
    ],
  },
  {
    value: "search_console",
    label: "Search Console",
    hint: "Performance → Export → CSV",
    templateCols: ["Date", "Query", "Impressions", "Clicks", "Conversions", "Cost"],
    sampleRows: [
      ["2026-06-01", "اسم البراند", "1200", "85", "0", "0"],
      ["2026-06-02", "اسم البراند", "1340", "92", "0", "0"],
    ],
  },
  {
    value: "shopify",
    label: "Shopify",
    hint: "Analytics → Reports → Export",
    templateCols: ["Date", "Channel", "Sessions", "Add to cart", "Orders", "Total sales"],
    sampleRows: [
      ["2026-06-01", "Online Store", "850", "120", "24", "4800.00"],
      ["2026-06-02", "Online Store", "910", "138", "29", "5320.00"],
    ],
  },
  {
    value: "salla",
    label: "سلة",
    hint: "التقارير → تصدير CSV",
    templateCols: ["التاريخ", "الحملة", "مرات الظهور", "النقرات", "الطلبات", "التكلفة"],
    sampleRows: [
      ["2026-06-01", "حملة الصيف", "5000", "210", "16", "180.00"],
      ["2026-06-02", "حملة الصيف", "5400", "225", "18", "195.50"],
    ],
  },
  {
    value: "zid",
    label: "زد",
    hint: "التقارير → تصدير CSV",
    templateCols: ["التاريخ", "القناة", "مشاهدات", "نقرات", "تحويلات", "الإنفاق"],
    sampleRows: [
      ["2026-06-01", "متجر", "4200", "190", "14", "0"],
      ["2026-06-02", "متجر", "4600", "205", "17", "0"],
    ],
  },
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

type RowError = { line: number; raw: string; reasons: string[] };

const ALIASES: Record<string, keyof ParsedRow> = {
  "date": "periodStart", "day": "periodStart",
  "reporting_starts": "periodStart", "reporting_ends": "periodEnd",
  "start_date": "periodStart", "end_date": "periodEnd",
  "اليوم": "periodStart", "التاريخ": "periodStart",
  "impressions": "views", "impr": "views", "impr.": "views",
  "views": "views", "sessions": "views",
  "ظهور": "views", "مرات_الظهور": "views", "مشاهدات": "views",
  "clicks": "clicks", "link_clicks": "clicks", "all_clicks": "clicks",
  "swipes": "clicks", "add_to_cart": "clicks",
  "نقرات": "clicks", "النقرات": "clicks",
  "conversions": "conversions", "results": "conversions",
  "purchases": "conversions", "orders": "conversions", "leads": "conversions",
  "تحويلات": "conversions", "طلبات": "conversions", "مبيعات": "conversions", "الطلبات": "conversions",
  "spend": "costSar", "cost": "costSar",
  "amount_spent_sar": "costSar", "amount_spent": "costSar", "total_sales": "costSar",
  "التكلفة": "costSar", "الإنفاق": "costSar", "تكلفة": "costSar",
  "campaign": "channel", "campaign_name": "channel",
  "ad_set_name": "channel", "channel": "channel", "query": "channel",
  "الحملة": "channel", "القناة": "channel",
};

function normalizeKey(k: string) {
  return k.trim().toLowerCase()
    .replace(/^\ufeff/, "")
    .replace(/\s+/g, "_")
    .replace(/[()]/g, "")
    .replace(/[.\-/]/g, "_");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = ""; let inQ = false;
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

function toNumber(v: string): { ok: boolean; n: number } {
  if (!v || !v.trim()) return { ok: true, n: 0 };
  const cleaned = v.replace(/[^\d.\-,]/g, "").replace(/,(?=\d{3}\b)/g, "");
  const n = parseFloat(cleaned.replace(/,/g, "."));
  if (!isFinite(n)) return { ok: false, n: 0 };
  return { ok: true, n };
}

function toIsoDate(v: string): string | null {
  if (!v) return null;
  const t = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(t)) return t.replace(/\//g, "-");
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10), y = m[3];
    return `${y}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
  }
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

type ParseResult = {
  rows: ParsedRow[];
  errors: RowError[];
  missingColumns: string[];
  detectedColumns: Partial<Record<keyof ParsedRow, string>>;
  totalLines: number;
};

function parseCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const empty: ParseResult = { rows: [], errors: [], missingColumns: [], detectedColumns: {}, totalLines: 0 };
  if (lines.length < 2) return { ...empty, missingColumns: ["الملف فارغ أو لا يحوي سوى رأس واحد"] };

  const headerRaw = splitCsvLine(lines[0]);
  const header = headerRaw.map(normalizeKey);
  const colIndex: Partial<Record<keyof ParsedRow, number>> = {};
  const detected: Partial<Record<keyof ParsedRow, string>> = {};
  header.forEach((h, i) => {
    const field = ALIASES[h];
    if (field && colIndex[field] === undefined) {
      colIndex[field] = i;
      detected[field] = headerRaw[i];
    }
  });

  const required: Array<keyof ParsedRow> = ["periodStart", "views", "clicks", "conversions", "costSar"];
  const labels: Record<keyof ParsedRow, string> = {
    periodStart: "تاريخ (date / day / التاريخ)",
    periodEnd: "تاريخ نهاية (end_date)",
    channel: "قناة (campaign / channel)",
    views: "مشاهدات (impressions / views / مشاهدات)",
    clicks: "نقرات (clicks / النقرات)",
    conversions: "تحويلات (conversions / results / طلبات)",
    costSar: "تكلفة (spend / cost / التكلفة)",
  };
  const missing: string[] = required.filter((f) => colIndex[f] === undefined).map((f) => labels[f]);

  if (missing.length > 0) {
    return { rows: [], errors: [], missingColumns: missing, detectedColumns: detected, totalLines: lines.length - 1 };
  }

  const rows: ParsedRow[] = [];
  const errors: RowError[] = [];

  for (let li = 1; li < lines.length; li++) {
    const cells = splitCsvLine(lines[li]);
    const reasons: string[] = [];

    const dsRaw = cells[colIndex.periodStart!] || "";
    const ds = toIsoDate(dsRaw);
    if (!ds) reasons.push(`تاريخ غير صالح: "${dsRaw}"`);
    const deRaw = colIndex.periodEnd !== undefined ? cells[colIndex.periodEnd] || "" : "";
    const de = colIndex.periodEnd !== undefined ? toIsoDate(deRaw) : ds;
    if (colIndex.periodEnd !== undefined && deRaw && !de) reasons.push(`تاريخ نهاية غير صالح: "${deRaw}"`);

    const v = toNumber(cells[colIndex.views!] || "");
    if (!v.ok) reasons.push(`مشاهدات غير رقمية: "${cells[colIndex.views!]}"`);
    const c = toNumber(cells[colIndex.clicks!] || "");
    if (!c.ok) reasons.push(`نقرات غير رقمية: "${cells[colIndex.clicks!]}"`);
    const co = toNumber(cells[colIndex.conversions!] || "");
    if (!co.ok) reasons.push(`تحويلات غير رقمية: "${cells[colIndex.conversions!]}"`);
    const sp = toNumber(cells[colIndex.costSar!] || "");
    if (!sp.ok) reasons.push(`تكلفة غير رقمية: "${cells[colIndex.costSar!]}"`);

    if (ds && de && new Date(de) < new Date(ds)) reasons.push("نهاية الفترة قبل بدايتها");
    if (v.ok && c.ok && v.n > 0 && c.n > v.n) reasons.push(`نقرات (${c.n}) > مشاهدات (${v.n})`);
    if (c.ok && co.ok && c.n > 0 && co.n > c.n) reasons.push(`تحويلات (${co.n}) > نقرات (${c.n})`);
    if (v.ok && v.n < 0) reasons.push("مشاهدات سالبة");
    if (c.ok && c.n < 0) reasons.push("نقرات سالبة");
    if (co.ok && co.n < 0) reasons.push("تحويلات سالبة");
    if (sp.ok && sp.n < 0) reasons.push("تكلفة سالبة");

    if (reasons.length > 0 || !ds) {
      errors.push({ line: li + 1, raw: lines[li].slice(0, 200), reasons: reasons.length ? reasons : ["تاريخ مفقود"] });
      continue;
    }

    rows.push({
      periodStart: ds!,
      periodEnd: de || ds!,
      channel: (colIndex.channel !== undefined ? cells[colIndex.channel] : "") || "all",
      views: Math.round(v.n),
      clicks: Math.round(c.n),
      conversions: Math.round(co.n),
      costSar: sp.n,
    });
  }

  return { rows, errors, missingColumns: [], detectedColumns: detected, totalLines: lines.length - 1 };
}

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildTemplateCsv(src: SourceDef): string {
  const esc = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const lines = [src.templateCols.map(esc).join(",")];
  for (const r of src.sampleRows) lines.push(r.map(esc).join(","));
  return "\ufeff" + lines.join("\n");
}

function downloadTemplate(src: SourceDef) {
  const csv = buildTemplateCsv(src);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kpi-template-${src.value}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type Props = { token: string; email: string; onImported?: () => void };

export function KpiCsvImport({ token, email, onImported }: Props) {
  const bulk = useServerFn(adminBulkImportKpi);
  const [source, setSource] = useState<string>("meta_ads");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParseResult>({ rows: [], errors: [], missingColumns: [], detectedColumns: {}, totalLines: 0 });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const currentSource = useMemo(() => SOURCES.find((s) => s.value === source)!, [source]);

  async function ingestText(text: string, name: string) {
    setRawText(text);
    setFileName(name);
    const hash = await sha256Hex(text);
    setFileHash(hash);
    setParsed(parseCsv(text));
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

  const summary = useMemo(() => parsed.rows.reduce(
    (a, r) => ({
      views: a.views + r.views,
      clicks: a.clicks + r.clicks,
      conversions: a.conversions + r.conversions,
      costSar: a.costSar + r.costSar,
    }),
    { views: 0, clicks: 0, conversions: 0, costSar: 0 },
  ), [parsed.rows]);

  async function onImport() {
    setMsg(null);
    if (parsed.rows.length === 0) { setMsg({ kind: "err", text: "لا توجد سطور صالحة للاستيراد" }); return; }
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
          rows: parsed.rows,
        },
      });
      const skipped = parsed.errors.length;
      setMsg({
        kind: "ok",
        text: `تم استيراد ${r.inserted} سطر${skipped ? ` (تم تخطي ${skipped} سطر غير صالح)` : ""}. بصمة المصدر: ${r.fileHash.slice(0, 16)}…`,
      });
      setParsed({ rows: [], errors: [], missingColumns: [], detectedColumns: {}, totalLines: 0 });
      setRawText(""); setFileName(""); setFileHash("");
      onImported?.();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "فشل الاستيراد" });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  const label = "text-xs font-bold text-muted-foreground";
  const hasAnyParse = parsed.totalLines > 0 || parsed.missingColumns.length > 0;

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-primary" />
        <h4 className="font-bold">استيراد تلقائي من CSV (Meta / Google / Shopify / سلة / زد)</h4>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        صدّر تقرير الفترة من لوحة المنصة كملف CSV، ارفعه هنا، وسيتم استخراج المشاهدات والنقرات والتحويلات والتكلفة لكل يوم/حملة تلقائياً.
        السطور غير الصالحة تُرفض ولن تُختم، وسنعرض لك سبب الرفض الدقيق لكل سطر.
        نقوم بحساب بصمة <b>SHA-256</b> للملف الأصلي وحفظها مع كل سجل كدليل على المصدر.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className={label}>المصدر</label>
          <select className={input} value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="mt-1 text-[10px] text-muted-foreground">طريقة التصدير: {currentSource.hint}</div>
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

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-background/60 p-2.5">
        <Download className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold">قالب جاهز لـ {currentSource.label}:</span>
        <button
          type="button"
          onClick={() => downloadTemplate(currentSource)}
          className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20"
        >
          تنزيل القالب CSV
        </button>
        <span className="text-[10px] text-muted-foreground">
          الأعمدة المتوقعة: <span className="font-mono">{currentSource.templateCols.join(" · ")}</span>
        </span>
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

      {parsed.missingColumns.length > 0 && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs">
          <div className="mb-2 flex items-center gap-2 font-bold text-destructive">
            <XCircle className="h-4 w-4" /> أعمدة مفقودة — لا يمكن المتابعة
          </div>
          <ul className="list-disc pr-5 leading-relaxed">
            {parsed.missingColumns.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
          <div className="mt-2 text-[11px] text-muted-foreground">
            استخدم زر «تنزيل القالب CSV» في الأعلى للحصول على ملف بالأعمدة الصحيحة لهذه المنصة.
          </div>
        </div>
      )}

      {hasAnyParse && parsed.missingColumns.length === 0 && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3 font-bold">
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> صالح: {parsed.rows.length}
                </span>
                {parsed.errors.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" /> مرفوض: {parsed.errors.length}
                  </span>
                )}
                <span className="text-muted-foreground">من إجمالي {parsed.totalLines}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground" title="SHA-256 للملف الأصلي">
                <Fingerprint className="h-3 w-3" /> {fileHash.slice(0, 16)}…
              </div>
            </div>

            <div className="mb-2 text-[10px] text-muted-foreground">
              تم التعرف على الأعمدة:{" "}
              {(["periodStart", "views", "clicks", "conversions", "costSar", "channel"] as const)
                .filter((k) => parsed.detectedColumns[k])
                .map((k) => `${k}=«${parsed.detectedColumns[k]}»`)
                .join(" · ")}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
              <div className="rounded bg-muted/40 p-2"><b>{summary.views.toLocaleString("ar-SA")}</b> مشاهدة</div>
              <div className="rounded bg-muted/40 p-2"><b>{summary.clicks.toLocaleString("ar-SA")}</b> نقرة</div>
              <div className="rounded bg-muted/40 p-2"><b>{summary.conversions.toLocaleString("ar-SA")}</b> تحويل</div>
              <div className="rounded bg-muted/40 p-2"><b>{summary.costSar.toFixed(2)}</b> ر.س</div>
            </div>

            {parsed.rows.length > 0 && (
              <div className="mt-2">
                <div className="mb-1 text-[10px] font-bold text-emerald-700">السطور الصالحة (ستُستورد):</div>
                <div className="max-h-40 overflow-auto rounded border border-emerald-500/30">
                  <table className="w-full text-right text-[11px]">
                    <thead className="sticky top-0 bg-emerald-500/10 text-[10px]"><tr>
                      <th className="p-1.5">الفترة</th><th className="p-1.5">القناة</th>
                      <th className="p-1.5">ظهور</th><th className="p-1.5">نقرات</th>
                      <th className="p-1.5">تحويلات</th><th className="p-1.5">تكلفة</th>
                    </tr></thead>
                    <tbody>
                      {parsed.rows.slice(0, 50).map((r, i) => (
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
                  {parsed.rows.length > 50 && (
                    <div className="p-1.5 text-center text-[10px] text-muted-foreground">… و{parsed.rows.length - 50} سطر آخر سيُستورد</div>
                  )}
                </div>
              </div>
            )}

            {parsed.errors.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-[10px] font-bold text-destructive">السطور المرفوضة (لن تُستورد):</div>
                <div className="max-h-48 overflow-auto rounded border border-destructive/30">
                  <table className="w-full text-right text-[11px]">
                    <thead className="sticky top-0 bg-destructive/10 text-[10px]"><tr>
                      <th className="p-1.5">السطر</th>
                      <th className="p-1.5">سبب الرفض</th>
                      <th className="p-1.5">المحتوى</th>
                    </tr></thead>
                    <tbody>
                      {parsed.errors.slice(0, 50).map((e, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="p-1.5 font-mono">#{e.line}</td>
                          <td className="p-1.5 text-destructive">{e.reasons.join("؛ ")}</td>
                          <td className="p-1.5 font-mono text-[10px] text-muted-foreground" title={e.raw}>
                            {e.raw.length > 60 ? e.raw.slice(0, 60) + "…" : e.raw}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.errors.length > 50 && (
                    <div className="p-1.5 text-center text-[10px] text-muted-foreground">… و{parsed.errors.length - 50} سطر مرفوض آخر</div>
                  )}
                </div>
              </div>
            )}
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
          disabled={busy || parsed.rows.length === 0}
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          ختم واستيراد السطور الصالحة ({parsed.rows.length})
        </button>
      </div>
    </div>
  );
}
