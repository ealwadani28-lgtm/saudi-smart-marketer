# Security Tests & FAQ

## تشغيل اختبارات الأمان

```bash
bun run scripts/security-tests.ts
```

يختبر:

- **RLS على دور `anon`**: محاولة SELECT / INSERT / UPDATE / DELETE مباشرة على `early_signups` و `rate_limits` — كلها يجب أن تفشل.
- **استدعاء `rl_hit` RPC** من العميل — يجب أن يُرفض.
- **`/api/generate-image`**: رفض origin أجنبي (403)، رفض body غير صالح (400)، وجود `X-Robots-Tag: noindex`.
- **`adminListSignups`**: رفض بدون token وبtoken خاطئ.
- **`adminLogin`**: رفض كلمة مرور خاطئة.

استخدم `BASE_URL=https://your-domain` لاختبار بيئة أخرى.

---

## سؤال "إخفاء الكود من Inspect/فحص الصفحة"

**باختصار: لا يمكن إخفاء كود الواجهة الأمامية (Frontend) بالكامل من المتصفح، وهذا ليس ثغرة أمنية.**

### لماذا؟
أي موقع، بدون استثناء (Google, Facebook, Stripe…)، يجب أن يُرسل كود HTML/CSS/JavaScript إلى متصفح المستخدم لكي يعمل. المتصفح ينفّذ الكود → DevTools يقدر يعرضه. لا توجد طريقة تقنية لمنع ذلك.

ما نفعله بالفعل:
- في **production build** الكود يُصغّر (minify) ويُحوّل لأسماء قصيرة (`a`, `b`, `c`) — صعب القراءة لكنه ليس مشفّر.
- **Source maps** غير منشورة في الإنتاج.

### إذًا أين الأمان الحقيقي؟
على **الخادم (Server)** — وهذا ما طبّقناه:

| لا يظهر أبدًا في المتصفح | لماذا |
|---|---|
| `ADMIN_PASSWORD` | محفوظ كـ Secret على الخادم، يُقارن داخل server function |
| `SUPABASE_SERVICE_ROLE_KEY` | يُستخدم فقط داخل ملفات `.server.ts` |
| `LOVABLE_API_KEY` | يُستدعى فقط من `/api/generate-image` على الخادم |
| منطق rate-limit و token validation | يعمل داخل `createServerFn` handlers |
| استعلامات DB الحساسة | محمية بـ RLS — حتى لو نسخ شخص الكود لا يستطيع القراءة |

### القاعدة الذهبية
> أي شيء حساس **يجب** أن يكون على الخادم. الكود الذي يصل المتصفح يجب أن يُعامل كأنه عام.

ما يظهر في DevTools حاليًا هو منطق UI فقط (مكوّنات React، تنسيقات Tailwind، استدعاءات fetch لـ endpoints محمية) — لا أسرار، لا مفاتيح، لا منطق أمني. هذا هو الوضع الصحيح.

### اختبر بنفسك
1. افتح الموقع → كلك يمين → فحص الصفحة → Sources.
2. ابحث عن `ADMIN_PASSWORD` أو `SERVICE_ROLE` أو `LOVABLE_API_KEY` — لن تجدها.
3. شغّل `scripts/security-tests.ts` للتأكد أن الـ RLS و endpoint protections شغّالة.
