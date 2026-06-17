import type { StoreSnapshot, StoreReport } from "./analyzer.functions";

type Opts = {
  snapshot: StoreSnapshot;
  report: StoreReport;
  createdAt?: string;
  tier: "free" | "paid";
};

/**
 * Opens a new window with a styled Arabic RTL report, ready to print to PDF.
 * Uses Tajawal from Google Fonts. No external libraries.
 */
export function printStoreReport({ snapshot, report, createdAt, tier }: Opts) {
  const dateStr = new Date(createdAt ?? Date.now()).toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const shopName = escapeHtml(snapshot.title || snapshot.url);
  const isFree = tier === "free";

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>تقرير تحليل المتجر — ${shopName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { font-family: 'Tajawal', system-ui, sans-serif; color: #0f172a; background: #f8fafc; }
  body { padding: 32px; line-height: 1.7; }
  .page { max-width: 820px; margin: 0 auto; background: #fff; padding: 48px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 28px; }
  .brand { font-weight: 800; font-size: 22px; color: #1e40af; }
  .brand small { display:block; font-size: 12px; color: #64748b; font-weight: 500; margin-top: 4px; }
  .meta { text-align: left; font-size: 13px; color: #64748b; }
  .meta strong { color: #0f172a; display: block; font-size: 15px; margin-bottom: 2px; }
  h1 { font-size: 26px; font-weight: 800; margin-bottom: 8px; }
  .subtitle { color: #475569; font-size: 15px; margin-bottom: 28px; }
  .summary-box { background: #eff6ff; border-right: 4px solid #1e40af; padding: 18px 20px; border-radius: 10px; margin-bottom: 28px; }
  .summary-box h3 { font-size: 14px; color: #1e40af; margin-bottom: 6px; font-weight: 700; }
  .summary-box p { font-size: 15px; }
  section { margin-bottom: 26px; page-break-inside: avoid; }
  section h2 { font-size: 18px; font-weight: 800; margin-bottom: 12px; padding-right: 12px; border-right: 4px solid; }
  .strengths h2 { border-color: #16a34a; color: #166534; }
  .weaknesses h2 { border-color: #dc2626; color: #991b1b; }
  .opportunities h2 { border-color: #ca8a04; color: #854d0e; }
  .recommendations h2 { border-color: #1e40af; color: #1e3a8a; }
  .competitors h2 { border-color: #7c3aed; color: #5b21b6; }
  .content-plan h2 { border-color: #0891b2; color: #155e75; }
  ul { list-style: none; }
  ul li { padding: 8px 18px; margin-bottom: 4px; background: #f1f5f9; border-radius: 8px; position: relative; font-size: 14.5px; }
  ul li:before { content: "•"; position: absolute; right: 6px; color: #94a3b8; font-weight: bold; }
  .rec-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
  .rec-item .rec-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .rec-item .rec-title { font-weight: 700; font-size: 15px; }
  .rec-item .rec-detail { color: #475569; font-size: 14px; }
  .badge { font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 700; }
  .badge.high { background: #fee2e2; color: #991b1b; }
  .badge.medium { background: #fef3c7; color: #854d0e; }
  .badge.low { background: #dcfce7; color: #166534; }
  .competitor-item { background: #faf5ff; border-right: 3px solid #7c3aed; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; }
  .competitor-item strong { display: block; margin-bottom: 4px; }
  .competitor-item span { font-size: 13px; color: #475569; }
  .plan-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
  .plan-item { display: grid; grid-template-columns: 60px 90px 1fr; gap: 12px; padding: 8px 12px; background: #ecfeff; border-radius: 6px; font-size: 13.5px; align-items: center; }
  .plan-item .day { font-weight: 800; color: #155e75; }
  .plan-item .platform { color: #0e7490; font-weight: 600; font-size: 12px; }
  .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
  .footer a { color: #1e40af; text-decoration: none; font-weight: 700; }
  .watermark-cta { margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #1e40af, #3b82f6); color: #fff; border-radius: 12px; text-align: center; }
  .watermark-cta h3 { font-size: 18px; font-weight: 800; margin-bottom: 6px; }
  .watermark-cta p { font-size: 14px; opacity: 0.95; margin-bottom: 10px; }
  .watermark-cta a { display: inline-block; background: #fff; color: #1e40af; padding: 8px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
  .stamp { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 90px; font-weight: 800; color: rgba(30, 64, 175, 0.06); pointer-events: none; z-index: 0; white-space: nowrap; }
  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; padding: 24px; border-radius: 0; max-width: none; }
    .no-print { display: none !important; }
    section { page-break-inside: avoid; }
    .stamp { position: fixed; }
  }
  .print-btn { position: fixed; top: 20px; left: 20px; background: #1e40af; color: #fff; border: 0; padding: 10px 18px; border-radius: 10px; font-family: inherit; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.15); font-size: 14px; }
</style>
</head>
<body>
${isFree ? '<div class="stamp">نسخة مجانية</div>' : ""}
<button class="print-btn no-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
<div class="page">
  <div class="header">
    <div class="brand">
      المسوّق الذكي
      <small>تقرير تحليل متجر — مدعوم بالذكاء الاصطناعي</small>
    </div>
    <div class="meta">
      <strong>${shopName}</strong>
      <span>${escapeHtml(snapshot.url)}</span><br/>
      <span>${dateStr}</span>
    </div>
  </div>

  <h1>تقرير تحليل المتجر</h1>
  <p class="subtitle">منصة المتجر: ${platformLabel(snapshot.signals.platform)} · ${snapshot.products.length} منتج تم رصده</p>

  <div class="summary-box">
    <h3>الخلاصة</h3>
    <p>${escapeHtml(report.summary)}</p>
  </div>

  ${section("strengths", "💪 نقاط القوة", report.strengths)}
  ${section("weaknesses", "⚠️ نقاط الضعف", report.weaknesses)}
  ${section("opportunities", "🚀 الفرص الفورية", report.opportunities)}

  <section class="recommendations">
    <h2>✅ التوصيات العملية</h2>
    ${report.recommendations
      .map(
        (r) => `
      <div class="rec-item">
        <div class="rec-head">
          <span class="rec-title">${escapeHtml(r.title)}</span>
          <span class="badge ${r.priority}">${priorityLabel(r.priority)}</span>
        </div>
        <div class="rec-detail">${escapeHtml(r.detail)}</div>
      </div>`,
      )
      .join("")}
  </section>

  ${
    report.competitors && report.competitors.length
      ? `<section class="competitors">
        <h2>🎯 منافسون في السوق</h2>
        ${report.competitors
          .map(
            (c) =>
              `<div class="competitor-item"><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(c.note)}</span></div>`,
          )
          .join("")}
      </section>`
      : ""
  }

  ${
    report.contentPlan && report.contentPlan.length
      ? `<section class="content-plan">
        <h2>📅 خطة محتوى ${report.contentPlan.length} يوم</h2>
        <div class="plan-grid">
          ${report.contentPlan
            .map(
              (p) =>
                `<div class="plan-item"><span class="day">يوم ${p.day}</span><span class="platform">${escapeHtml(p.platform)}</span><span>${escapeHtml(p.idea)}</span></div>`,
            )
            .join("")}
        </div>
      </section>`
      : ""
  }

  ${
    isFree
      ? `<div class="watermark-cta">
        <h3>تبي تحليل أعمق وتحديث تلقائي كل أسبوعين؟</h3>
        <p>اشترك في النسخة الكاملة واحصل على تحليل المنافسين وخطة محتوى 30 يوم وتقارير دورية.</p>
        <a href="https://justmarketing.sa/subscribe">اشترك الآن</a>
      </div>`
      : ""
  }

  <div class="footer">
    تقرير تم توليده بواسطة <a href="https://justmarketing.sa">المسوّق الذكي</a> — جميع الحقوق محفوظة © ${new Date().getFullYear()}
  </div>
</div>
<script>setTimeout(function(){window.focus();}, 200);</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("الرجاء السماح بفتح النوافذ المنبثقة لتنزيل التقرير");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function section(cls: string, title: string, items: string[]): string {
  if (!items || !items.length) return "";
  return `<section class="${cls}">
    <h2>${title}</h2>
    <ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
  </section>`;
}

function priorityLabel(p: "high" | "medium" | "low"): string {
  return p === "high" ? "عاجل" : p === "medium" ? "مهم" : "لاحقاً";
}

function platformLabel(p: StoreSnapshot["signals"]["platform"]): string {
  return p === "zid" ? "زد" : p === "salla" ? "سلة" : p === "shopify" ? "Shopify" : "أخرى";
}
