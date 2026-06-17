# خطة: محلّل المتاجر الذكي + تقرير PDF

## الهدف
العميل يدخل رابط متجره (زد/سلة)، السيرفر يجيب HTML، Gemini يحلل، التقرير يُعرض ويُحفظ، وزر "تحميل PDF" يولّد تقرير عربي احترافي في المتصفح.

## نسختان

| الميزة | مجاني `/try` | مدفوع `/workspace` |
|---|---|---|
| تحليل أساسي | ✅ | ✅ أعمق |
| منافسون | ❌ | ✅ 3-5 |
| خطة محتوى 30 يوم | ❌ | ✅ |
| تحديث تلقائي | ❌ مرة واحدة | ✅ كل أسبوعين |
| PDF | ✅ مع watermark خفيف | ✅ نظيف باسم المتجر |
| CTA داخل التقرير | "اشترك للمزيد" | — |

## التنفيذ التقني

### 1) جلب HTML المتجر — server function
- `src/lib/analyzer.functions.ts` → `fetchStoreSnapshot({ url })`
- `fetch()` عادي (Workers-compatible، بدون puppeteer)
- استخراج بـ regex + DOM lite (linkedom أو cheerio-lite — نتحقق من توافق Worker)
- نستخرج: title, meta description, og:*, منتجات (أسماء/أسعار/صور)، روابط سوشيال، واتساب، categories
- rate-limit per IP/user عبر `rl_hit`

### 2) تحليل Gemini — نفس الملف
- `analyzeStore({ url, tier: 'free' | 'paid' })`
- يستخدم `google/gemini-3-flash-preview` عبر Lovable AI Gateway (مفتاح موجود)
- prompt عربي مهيكل يُرجع JSON: `{ strengths[], weaknesses[], opportunities[], recommendations[], competitors?, contentPlan? }`
- الفرق بين tier: depth + الأقسام الإضافية للـ paid

### 3) التخزين
جدول جديد `store_analyses`:
```
id, customer_id (nullable للمجاني), email (nullable), store_url,
tier ('free'|'paid'), snapshot jsonb, report jsonb,
created_at, next_refresh_at
```
+ GRANTs + RLS (المجاني: insert من anon مع rate-limit؛ المدفوع: قراءة عبر server fn).

### 4) التحديث التلقائي (paid)
- `next_refresh_at = now() + interval '14 days'`
- pg_cron job يستدعي endpoint عام `/api/public/refresh-analyses` يعيد التحليل للسجلات المستحقّة ويضيف entry في `customer_updates` type=`analysis`.

### 5) واجهة `/workspace`
- قسم "تحليل متجرك": إدخال رابط أول مرة → زر "حلّل الآن"
- بعد التحليل: بطاقات للأقسام (قوة/ضعف/فرص/توصيات/منافسون/خطة محتوى)
- timeline للتحليلات السابقة
- زر "تحميل PDF" لكل تقرير

### 6) واجهة `/try`
- نموذج بسيط: email + store_url
- نتيجة فورية (tier=free)
- watermark خفيف في PDF + CTA للاشتراك

### 7) PDF عربي في المتصفح
- نفس أسلوب فاتورة الأدمن: `window.open()` بـ HTML/CSS عربي RTL + خط Tajawal من Google Fonts + `@media print`
- بدون مكتبات خارجية
- يحتوي: شعار، اسم المتجر، التاريخ، كل الأقسام، تذييل

## الأسئلة قبل التنفيذ
1. خط الـ PDF: Tajawal (موجود)، Cairo، أم IBM Plex Sans Arabic؟
2. في `/try` المجاني — نطلب email إجباري قبل عرض التقرير (lead capture)، أم نعرض مباشرة بدون email؟
3. التحليل الأول في `/workspace` — تلقائي بعد التفعيل، أم بضغطة من العميل؟

## ترتيب التنفيذ (PRs مستقلة)
1. Migration: جدول `store_analyses` + RLS + GRANTs
2. `analyzer.functions.ts`: fetch + parse + Gemini
3. تحديث `/workspace`: قسم التحليل + عرض + PDF
4. `/try`: نموذج + نتيجة + PDF مع watermark
5. pg_cron + endpoint التحديث التلقائي
