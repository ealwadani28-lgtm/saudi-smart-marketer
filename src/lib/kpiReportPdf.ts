import type { KpiEntry, KpiAggregate } from "./kpi.functions";

type PlanProgress = {
  name: string;
  target: string;
  frequency: string;
  progress: { actual: number; targetValue: number; percent: number; unit: string } | null;
};

type Opts = {
  entries: KpiEntry[];
  aggregate: KpiAggregate;
  planProgress?: PlanProgress[];
  customerName?: string;
  customerEmail?: string;
};

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

function esc(s: string | number | null | undefined): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function fmt(n: number, d = 0) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("ar-SA", { maximumFractionDigits: d, minimumFractionDigits: d });
}

export function printKpiReport({ entries, aggregate, planProgress = [], customerName, customerEmail }: Opts) {
  const dateStr = new Date().toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
  const periodFrom = entries.length ? entries[entries.length - 1].period_start : "—";
  const periodTo = entries.length ? entries[0].period_end : "—";

  const rowsHtml = entries
    .map(
      (e) => `
      <tr>
        <td>${esc(e.period_start)} ← ${esc(e.period_end)}</td>
        <td>${esc(e.channel)}</td>
        <td>${esc(SOURCE_LABEL[e.source] ?? e.source)}</td>
        <td>${fmt(e.views)}</td>
        <td>${fmt(e.clicks)}</td>
        <td>${fmt(e.conversions)}</td>
        <td>${fmt(Number(e.cost_sar), 2)}</td>
        <td><a href="${esc(e.evidence_url)}" target="_blank">إثبات</a></td>
        <td class="hash" title="مختوم في ${esc(new Date(e.sealed_at).toLocaleString("ar-SA"))}">${esc(e.entry_hash.slice(0, 12))}…</td>
      </tr>`,
    )
    .join("");

  const progressHtml = planProgress.length
    ? `<h2>التقدّم مقابل أهداف الخطة</h2>
       <div class="goals">
         ${planProgress
           .map((p) => {
             if (!p.progress) {
               return `<div class="goal"><div class="goal-head"><b>${esc(p.name)}</b><span>الهدف: ${esc(p.target)} • ${esc(p.frequency)}</span></div><div class="muted">لا توجد بيانات كافية بعد.</div></div>`;
             }
             const pct = Math.min(100, p.progress.percent);
             return `<div class="goal">
               <div class="goal-head"><b>${esc(p.name)}</b><span>الهدف: ${esc(p.target)} • ${esc(p.frequency)}</span></div>
               <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
               <div class="goal-foot"><span>الحالي: <b>${fmt(p.progress.actual, p.progress.unit === "%" ? 2 : 0)} ${esc(p.progress.unit)}</b></span><span><b>${fmt(p.progress.percent, 0)}%</b> من الهدف</span></div>
             </div>`;
           })
           .join("")}
       </div>`
    : "";

  const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<title>تقرير KPIs — ${esc(customerName || customerEmail || "العميل")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Tajawal',system-ui,sans-serif;color:#0f172a;background:#f8fafc;padding:28px;line-height:1.7}
  .page{max-width:880px;margin:0 auto;background:#fff;padding:40px;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:2px solid #e2e8f0;margin-bottom:22px}
  .brand{font-weight:800;font-size:20px;color:#1e40af}
  .brand small{display:block;font-size:12px;color:#64748b;font-weight:500;margin-top:4px}
  .meta{text-align:left;font-size:13px;color:#64748b}
  h1{font-size:22px;margin-bottom:6px}
  h2{font-size:17px;margin:22px 0 10px;color:#1e293b}
  .sub{color:#64748b;font-size:13px;margin-bottom:18px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0 8px}
  .kpi{border:1px solid #e2e8f0;border-radius:12px;padding:12px}
  .kpi .lbl{font-size:11px;color:#64748b}
  .kpi .val{font-weight:800;font-size:18px;margin-top:2px}
  .kpi .sub2{font-size:10px;color:#64748b;margin-top:2px}
  .goals{display:grid;gap:10px}
  .goal{border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px}
  .goal-head{display:flex;justify-content:space-between;font-size:13px}
  .goal-head span{color:#64748b;font-size:11px}
  .bar{height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;margin:6px 0}
  .fill{height:100%;background:linear-gradient(90deg,#10b981,#1e40af)}
  .goal-foot{display:flex;justify-content:space-between;font-size:11px;color:#64748b}
  .muted{color:#94a3b8;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-top:6px;font-size:11.5px}
  th,td{padding:6px 7px;border-bottom:1px solid #e2e8f0;text-align:right;vertical-align:top}
  th{background:#f1f5f9;font-weight:700;color:#334155;font-size:10.5px;text-transform:uppercase}
  td.hash,.hash{font-family:'Courier New',monospace;font-size:9.5px;color:#64748b}
  a{color:#1e40af;text-decoration:none}
  .seal{margin-top:24px;padding:14px;border:1px dashed #94a3b8;border-radius:12px;background:#f8fafc;font-size:11.5px;color:#475569}
  .seal b{color:#0f172a}
  .footer{margin-top:18px;padding-top:14px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8}
  @media print {
    body{background:#fff;padding:0}
    .page{box-shadow:none;border-radius:0;padding:24px;max-width:none}
    .no-print{display:none}
  }
  .toolbar{position:fixed;top:14px;left:14px;display:flex;gap:8px;z-index:10}
  .btn{background:#1e40af;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer}
  .btn.alt{background:#fff;color:#1e40af;border:1px solid #1e40af}
</style></head><body>
<div class="toolbar no-print">
  <button class="btn" onclick="window.print()">طباعة / حفظ PDF</button>
  <button class="btn alt" onclick="window.close()">إغلاق</button>
</div>
<div class="page">
  <div class="header">
    <div class="brand">المسوّق الذكي<small>تقرير لوحة الأداء (KPIs) — موثّق ومختوم</small></div>
    <div class="meta">
      <div><b>${esc(customerName || customerEmail || "")}</b></div>
      ${customerEmail && customerName ? `<div>${esc(customerEmail)}</div>` : ""}
      <div>تاريخ التقرير: ${esc(dateStr)}</div>
      <div>الفترة: ${esc(periodFrom)} ← ${esc(periodTo)}</div>
    </div>
  </div>

  <h1>ملخص الأداء</h1>
  <p class="sub">إجمالي ${entries.length} إدخالاً موثّقاً، كل سطر مختوم ببصمة SHA-256 وختم زمني غير قابل للتعديل أو الحذف.</p>

  <div class="kpis">
    <div class="kpi"><div class="lbl">المشاهدات</div><div class="val">${fmt(aggregate.views)}</div></div>
    <div class="kpi"><div class="lbl">النقرات</div><div class="val">${fmt(aggregate.clicks)}</div><div class="sub2">CTR ${fmt(aggregate.ctr, 2)}%</div></div>
    <div class="kpi"><div class="lbl">التحويلات</div><div class="val">${fmt(aggregate.conversions)}</div><div class="sub2">CVR ${fmt(aggregate.cvr, 2)}%</div></div>
    <div class="kpi"><div class="lbl">الإنفاق</div><div class="val">${fmt(aggregate.costSar, 2)} ر.س</div><div class="sub2">${aggregate.conversions > 0 ? `CPA ${fmt(aggregate.cpa, 2)} ر.س` : aggregate.clicks > 0 ? `CPC ${fmt(aggregate.cpc, 2)} ر.س` : ""}</div></div>
  </div>

  ${progressHtml}

  <h2>سجل الإدخالات الموثّقة</h2>
  ${
    entries.length === 0
      ? `<p class="muted">لا توجد إدخالات بعد.</p>`
      : `<table>
          <thead><tr>
            <th>الفترة</th><th>القناة</th><th>المصدر</th>
            <th>مشاهدات</th><th>نقرات</th><th>تحويلات</th><th>تكلفة (ر.س)</th>
            <th>رابط الإثبات</th><th>بصمة SHA-256</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
         </table>`
  }

  <div class="seal">
    <b>شهادة موثوقية:</b> كل صف في الجدول أعلاه أُدخل من قِبل فريق المسوّق الذكي مع رابط إثبات رسمي من منصة المصدر،
    وتم ختمه تلقائياً ببصمة <b>SHA-256</b> وختم زمني في قاعدة البيانات. الجدول مُعدّ بنمط <b>Append-only</b> —
    يمنع نظامياً أي تعديل أو حذف لاحق. يمكن لأي طرف ثالث التحقق من البصمات عبر إعادة حساب الـ hash للحقول.
  </div>

  <div class="footer">المسوّق الذكي · تقرير مُولّد آلياً · ${esc(dateStr)}</div>
</div>
<script>setTimeout(()=>{try{window.focus();window.print();}catch(e){}}, 600);</script>
</body></html>`;

  const w = window.open("", "_blank", "width=1024,height=800");
  if (!w) {
    alert("الرجاء السماح بفتح النوافذ المنبثقة لتصدير التقرير.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
