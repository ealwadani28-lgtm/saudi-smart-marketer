import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Upload, Download, Sparkles, ShieldCheck, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { userBulkImportKpi } from "@/lib/kpi.functions";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "تكاملات الإعلانات — TikTok + Snapchat | المسوق الذكي" },
      {
        name: "description",
        content:
          "استورد بيانات أداء حملاتك الإعلانية من TikTok Ads و Snapchat Ads مباشرة إلى لوحة KPIs. السوق السعودي يستهلك Snap و TikTok أكثر من Meta.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IntegrationsPage,
});

type Platform = "tiktok_ads" | "snapchat_ads";

const PLATFORMS: Record<Platform, {
  label: string;
  channel: string;
  helpUrl: string;
  templateHeader: string[];
  sampleRow: string[];
  // candidate header names (lowercased) for auto-detection
  fields: {
    date: string[];
    dateEnd?: string[];
    impressions: string[];
    clicks: string[];
    conversions: string[];
    cost: string[];
  };
}> = {
  tiktok_ads: {
    label: "TikTok Ads",
    channel: "tiktok",
    helpUrl: "https://ads.tiktok.com/help/article/export-data",
    templateHeader: ["Date", "Impressions", "Clicks", "Conversions", "Cost"],
    sampleRow: ["2026-06-01", "12500", "320", "18", "450.75"],
    fields: {
      date: ["date", "day", "by day", "stat time day", "stat_time_day"],
      impressions: ["impressions", "impr.", "impr", "show"],
      clicks: ["clicks", "click"],
      conversions: ["conversions", "total conversions", "conversion", "result", "results", "purchases"],
      cost: ["cost", "spend", "amount spent", "total spend"],
    },
  },
  snapchat_ads: {
    label: "Snapchat Ads",
    channel: "snapchat",
    helpUrl: "https://businesshelp.snapchat.com/s/article/reporting",
    templateHeader: ["Day", "Impressions", "Swipes", "Conversions", "Spend"],
    sampleRow: ["2026-06-01", "9800", "210", "12", "320.50"],
    fields: {
      date: ["day", "date", "report day"],
      impressions: ["impressions", "impr", "paid impressions"],
      clicks: ["swipes", "swipe ups", "swipe-ups", "clicks"],
      conversions: ["conversions", "purchases", "total purchases", "pixel purchases"],
      cost: ["spend", "cost", "amount spent"],
    },
  },
};

// ---------- CSV parsing ----------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function normHeader(s: string): string {
  return s.toLowerCase().replace(/[_\-]/g, " ").replace(/\s+/g, " ").trim();
}

function findCol(headers: string[], candidates: string[]): number {
  const norm = headers.map(normHeader);
  for (const cand of candidates) {
    const idx = norm.indexOf(cand);
    if (idx !== -1) return idx;
  }
  // partial match fallback
  for (const cand of candidates) {
    const idx = norm.findIndex((h) => h.includes(cand));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseDate(s: string): string | null {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  // m/d/yyyy or d/m/yyyy → assume yyyy-mm-dd output
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [_, a, b, y] = m;
    const mm = a.padStart(2, "0");
    const dd = b.padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function parseNum(s: string): number {
  const t = String(s).replace(/[,\s]/g, "").replace(/[^0-9.\-]/g, "");
  const n = parseFloat(t);
  return isFinite(n) ? n : 0;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type ParsedRow = {
  periodStart: string;
  periodEnd: string;
  channel: string;
  views: number;
  clicks: number;
  conversions: number;
  costSar: number;
};

function mapRows(csvText: string, platform: Platform): { rows: ParsedRow[]; warnings: string[] } {
  const grid = parseCsv(csvText);
  if (grid.length < 2) throw new Error("الملف لا يحتوي على بيانات كافية");
  const headers = grid[0];
  const def = PLATFORMS[platform];

  const di = findCol(headers, def.fields.date);
  const ii = findCol(headers, def.fields.impressions);
  const ci = findCol(headers, def.fields.clicks);
  const cv = findCol(headers, def.fields.conversions);
  const co = findCol(headers, def.fields.cost);

  const missing: string[] = [];
  if (di === -1) missing.push("التاريخ");
  if (ii === -1) missing.push("المشاهدات/الظهور");
  if (ci === -1) missing.push("النقرات/Swipes");
  if (co === -1) missing.push("التكلفة/Spend");
  if (missing.length) throw new Error(`أعمدة مفقودة: ${missing.join("، ")}`);

  const warnings: string[] = [];
  if (cv === -1) warnings.push("لم نجد عمود التحويلات — سيُحتسب 0");

  const rows: ParsedRow[] = [];
  for (let i = 1; i < grid.length; i++) {
    const r = grid[i];
    const date = parseDate(r[di] ?? "");
    if (!date) continue;
    const views = Math.floor(parseNum(r[ii] ?? "0"));
    const clicks = Math.floor(parseNum(r[ci] ?? "0"));
    const conversions = cv === -1 ? 0 : Math.floor(parseNum(r[cv] ?? "0"));
    const costSar = parseNum(r[co] ?? "0");
    rows.push({
      periodStart: date,
      periodEnd: date,
      channel: def.channel,
      views,
      clicks,
      conversions: Math.min(conversions, clicks || conversions),
      costSar,
    });
  }
  if (rows.length === 0) throw new Error("لم نتمكن من قراءة أي سطر صالح");
  return { rows, warnings };
}

// ---------- UI ----------

function IntegrationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("tiktok_ads");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number } | null>(null);
  const bulkImport = useServerFn(userBulkImportKpi);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  const preview = useMemo(() => {
    if (!csvText.trim()) return null;
    try { return mapRows(csvText, platform); }
    catch (e) { return { error: e instanceof Error ? e.message : String(e) } as const; }
  }, [csvText, platform]);

  const def = PLATFORMS[platform];

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setCsvText(await f.text());
    setResult(null);
  }

  function downloadTemplate() {
    const csv = [def.templateHeader.join(","), def.sampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${platform}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onSubmit() {
    if (!userId) { toast.error("سجل دخولك من /workspace أولاً"); return; }
    if (!preview || "error" in preview) { toast.error("راجع الملف أولاً"); return; }
    if (!evidenceUrl.trim()) { toast.error("أضف رابط لقطة شاشة كإثبات (Google Drive / Imgur)"); return; }
    setBusy(true);
    try {
      const hash = await sha256Hex(csvText);
      const res = await bulkImport({
        data: {
          userId,
          source: platform,
          fileName: fileName || `${platform}.csv`,
          fileHash: hash,
          evidenceUrl: evidenceUrl.trim(),
          rows: preview.rows,
        },
      });
      setResult({ inserted: res.inserted });
      toast.success(`تم استيراد ${res.inserted} سجل بنجاح`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الاستيراد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" /> الرئيسية
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            تكاملات الإعلانات
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold">استيراد بيانات الحملات</h1>
        <p className="mt-2 text-muted-foreground">
          الجمهور السعودي يقضي وقته على <strong>TikTok</strong> و <strong>Snapchat</strong> أكثر من Meta — لذلك بدأنا بهما.
          ارفع تقرير CSV من Ads Manager لتُحدّث لوحة KPIs تلقائياً.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-border p-1 max-w-md">
          {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPlatform(p); setCsvText(""); setFileName(""); setResult(null); }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                platform === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {PLATFORMS[p].label}
            </button>
          ))}
        </div>

        <section className="mt-6 rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold">١. حمّل قالب {def.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                الأعمدة المتوقعة: {def.templateHeader.join(" • ")}
              </p>
              <a
                href={def.helpUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-primary hover:underline"
              >
                كيف أصدّر التقرير من {def.label}؟
              </a>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <Download className="size-4" /> تحميل القالب
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">٢. ارفع الملف</h2>
          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border px-4 py-6 hover:bg-muted/40">
            <Upload className="size-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm">{fileName || "اختر ملف CSV من جهازك"}</div>
              <div className="text-xs text-muted-foreground">حتى 500 سطر</div>
            </div>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>

          {csvText && (
            <div className="mt-4">
              {preview && "error" in preview ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {preview.error}
                </div>
              ) : preview ? (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="size-4" /> تم التعرف على {preview.rows.length} سطر
                  </div>
                  {preview.warnings.length > 0 && (
                    <ul className="mt-2 list-disc pr-4 text-xs text-yellow-600 dark:text-yellow-500">
                      {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  )}
                  <div className="mt-3 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1 text-right">التاريخ</th>
                          <th className="px-2 py-1 text-right">المشاهدات</th>
                          <th className="px-2 py-1 text-right">النقرات</th>
                          <th className="px-2 py-1 text-right">التحويلات</th>
                          <th className="px-2 py-1 text-right">التكلفة (ر.س)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.slice(0, 5).map((r, i) => (
                          <tr key={i} className="border-t border-border/40">
                            <td className="px-2 py-1">{r.periodStart}</td>
                            <td className="px-2 py-1">{r.views.toLocaleString()}</td>
                            <td className="px-2 py-1">{r.clicks.toLocaleString()}</td>
                            <td className="px-2 py-1">{r.conversions.toLocaleString()}</td>
                            <td className="px-2 py-1">{r.costSar.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">٣. رابط الإثبات (لقطة شاشة)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            ارفع لقطة شاشة من Ads Manager على Google Drive / Imgur وضع الرابط هنا — هذا يحمي مصداقية الأرقام (Append-only).
          </p>
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </section>

        <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />
            البيانات تُختم بـ SHA-256 ولا يمكن تعديلها بعد الحفظ
          </div>
          <button
            onClick={onSubmit}
            disabled={busy || !preview || "error" in (preview ?? {}) || !userId}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "جاري الاستيراد..." : "استيراد إلى لوحة KPIs"}
          </button>
        </div>

        {!userId && (
          <p className="mt-3 text-sm text-yellow-600 dark:text-yellow-500">
            لازم تسجل دخول أولاً من <Link to="/workspace" className="underline">لوحة العمل</Link>.
          </p>
        )}

        {result && (
          <div className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            ✓ تم استيراد {result.inserted} سجل. افتح{" "}
            <Link to="/workspace" className="font-semibold underline">لوحة KPIs</Link>{" "}
            لرؤية الأداء.
          </div>
        )}

        <section className="mt-10 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground">لماذا لا يوجد ربط مباشر OAuth؟</h3>
          <p className="mt-2 leading-7">
            ربط OAuth الكامل مع TikTok/Snap يتطلب مراجعة تطبيق من المنصة (تستغرق أسابيع) والتزام تشغيلي مستمر.
            بدلاً من تأخير إطلاق هذه الميزة، اعتمدنا تصدير CSV (دقيقتان) — نفس البيانات، صفر انتظار، صفر اعتماد على APIs قد تتغير.
            في المستقبل، إذا طلب أغلب العملاء OAuth، سنفعّله كميزة مدفوعة منفصلة.
          </p>
        </section>
      </main>
    </div>
  );
}
