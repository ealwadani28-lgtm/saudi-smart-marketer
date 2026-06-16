import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — المسوق الذكي" },
      {
        name: "description",
        content:
          "سياسة الخصوصية لمنصة المسوق الذكي، متوافقة مع نظام حماية البيانات الشخصية السعودي (PDPL).",
      },
      { property: "og:title", content: "سياسة الخصوصية — المسوق الذكي" },
      {
        property: "og:description",
        content: "كيف نجمع، نستخدم، ونحمي بياناتك الشخصية وفقاً للأنظمة السعودية.",
      },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            <span>العودة للرئيسية</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">المسوق الذكي</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <h1 className="font-display text-3xl font-bold md:text-4xl">سياسة الخصوصية</h1>
        <p className="mt-3 text-sm text-muted-foreground">آخر تحديث: يونيو ٢٠٢٦</p>

        <div className="prose-content mt-10 space-y-8 leading-loose text-foreground/90">
          <Section title="١. مقدمة">
            <p>
              نحن في <strong>المسوق الذكي</strong> نلتزم بحماية خصوصية مستخدمينا وفقاً
              لـ <strong>نظام حماية البيانات الشخصية السعودي (PDPL)</strong> الصادر عن
              الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا). تشرح هذه السياسة كيف
              نجمع بياناتك ونستخدمها ونحميها.
            </p>
          </Section>

          <Section title="٢. البيانات التي نجمعها">
            <ul className="list-inside list-disc space-y-2">
              <li><strong>البريد الإلكتروني</strong>: لإرسال التحديثات والإشعارات حول إطلاق المنصة.</li>
              <li><strong>رابط المتجر (اختياري)</strong>: لتقديم تحليل مجاني مخصص لمتجرك.</li>
              <li><strong>بيانات الاستخدام</strong>: معلومات تقنية أساسية مثل نوع المتصفح وصفحات الموقع التي تمت زيارتها.</li>
            </ul>
          </Section>

          <Section title="٣. كيف نستخدم بياناتك">
            <ul className="list-inside list-disc space-y-2">
              <li>التواصل معك بخصوص خدمات المنصة وتحديثاتها.</li>
              <li>تقديم تحليل مجاني لمتجرك عند الطلب.</li>
              <li>تحسين تجربة المستخدم وأداء المنصة.</li>
              <li>الامتثال للالتزامات القانونية في المملكة العربية السعودية.</li>
            </ul>
          </Section>

          <Section title="٤. حماية بياناتك">
            <p>
              نستخدم تقنيات تشفير حديثة (HTTPS/TLS) ونعتمد على بنية تحتية سحابية آمنة
              لتخزين بياناتك. لا نشارك بياناتك مع أي طرف ثالث لأغراض تسويقية،
              ولا نبيعها تحت أي ظرف.
            </p>
          </Section>

          <Section title="٥. حقوقك">
            <p>وفقاً لنظام حماية البيانات الشخصية، لك الحق في:</p>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li><strong>الوصول</strong> إلى بياناتك الشخصية المحفوظة لدينا.</li>
              <li><strong>تصحيح</strong> أي بيانات غير دقيقة.</li>
              <li><strong>حذف</strong> بياناتك من أنظمتنا.</li>
              <li><strong>سحب موافقتك</strong> في أي وقت.</li>
              <li><strong>تقديم شكوى</strong> للهيئة السعودية للبيانات والذكاء الاصطناعي.</li>
            </ul>
          </Section>

          <Section title="٦. ملفات تعريف الارتباط (Cookies)">
            <p>
              نستخدم ملفات تعريف ارتباط أساسية فقط لتشغيل الموقع. لا نستخدم ملفات
              تتبع إعلانية من أطراف ثالثة دون موافقتك الصريحة.
            </p>
          </Section>

          <Section title="٧. الاحتفاظ بالبيانات">
            <p>
              نحتفظ ببياناتك طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمة.
              يمكنك طلب الحذف الكامل في أي وقت عبر التواصل معنا.
            </p>
          </Section>

          <Section title="٨. التواصل معنا">
            <p>
              لأي استفسار يخص الخصوصية أو لممارسة حقوقك، تواصل معنا عبر:
            </p>
            <p className="mt-2">
              <a href="mailto:contact@justlator.tech" className="text-primary underline">
                contact@justlator.tech
              </a>
            </p>
          </Section>

          <Section title="٩. التحديثات على هذه السياسة">
            <p>
              قد نحدّث هذه السياسة من وقت لآخر. سنُعلمك بأي تغييرات جوهرية عبر
              البريد الإلكتروني أو إشعار على الموقع.
            </p>
          </Section>
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-accent/30 p-6 text-center text-sm text-muted-foreground">
          هذه السياسة تخضع لأنظمة المملكة العربية السعودية 🇸🇦
        </div>
      </main>
      <JustlatorFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">{title}</h2>
      <div className="mt-3 text-base text-foreground/80">{children}</div>
    </section>
  );
}
