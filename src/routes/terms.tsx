import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام — المسوق الذكي" },
      {
        name: "description",
        content:
          "شروط استخدام منصة المسوق الذكي للتسويق الإلكتروني للمتاجر السعودية.",
      },
      { property: "og:title", content: "شروط الاستخدام — المسوق الذكي" },
      {
        property: "og:description",
        content: "الشروط والأحكام التي تحكم استخدامك لمنصة المسوق الذكي.",
      },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            <span>العودة للرئيسية</span>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">المسوق الذكي</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <h1 className="font-display text-3xl font-bold md:text-4xl">شروط الاستخدام</h1>
        <p className="mt-3 text-sm text-muted-foreground">آخر تحديث: يونيو ٢٠٢٦</p>

        <div className="mt-10 space-y-8 leading-loose text-foreground/90">
          <Section title="١. القبول بالشروط">
            <p>
              باستخدامك لمنصة <strong>المسوق الذكي</strong> أو تسجيلك في قائمة الانتظار،
              فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق على أي بند منها،
              يُرجى عدم استخدام المنصة.
            </p>
          </Section>

          <Section title="٢. وصف الخدمة">
            <p>
              المسوق الذكي منصة سعودية تقدم خدمات تسويق إلكتروني للمتاجر المحلية،
              بأسعار شفافة وبدون عقود طويلة الأجل. الخدمات قيد التطوير حالياً، وسيتم
              إطلاقها رسمياً للمسجلين في قائمة الانتظار.
            </p>
          </Section>

          <Section title="٣. الأهلية">
            <ul className="list-inside list-disc space-y-2">
              <li>يجب أن يكون عمرك ١٨ سنة فأكثر.</li>
              <li>أن تكون مالكاً أو ممثلاً قانونياً لمتجر إلكتروني.</li>
              <li>الالتزام بأنظمة المملكة العربية السعودية وأنظمة التجارة الإلكترونية.</li>
            </ul>
          </Section>

          <Section title="٤. التزامات المستخدم">
            <ul className="list-inside list-disc space-y-2">
              <li>تقديم معلومات صحيحة ودقيقة عند التسجيل.</li>
              <li>عدم استخدام المنصة لأي غرض غير قانوني أو مخالف للأنظمة.</li>
              <li>احترام حقوق الملكية الفكرية للمنصة ومحتواها.</li>
              <li>عدم محاولة اختراق المنصة أو إساءة استخدامها.</li>
            </ul>
          </Section>

          <Section title="٥. الدفع والأسعار">
            <p>
              الأسعار المعلنة (٩٩٩ ريال للحملة الواحدة) شاملة لجميع الخدمات الموضحة
              في صفحة الأسعار. قد تُضاف ضريبة القيمة المضافة (١٥٪) حسب الأنظمة
              السعودية. لا توجد رسوم خفية، ولا عقود سنوية إجبارية.
            </p>
          </Section>

          <Section title="٦. سياسة الاسترداد">
            <p>
              نلتزم بمعيار <strong>"نتائج أو استرداد كامل"</strong>:
              إذا لم تحقق الحملة الحد الأدنى من الأهداف المتفق عليها خلال ٣٠ يوم،
              يحق لك استرداد كامل مبلغ الحملة دون أي خصومات.
            </p>
          </Section>

          <Section title="٧. الملكية الفكرية">
            <p>
              جميع المحتويات والشعارات والتصاميم على المنصة مملوكة للمسوق الذكي،
              ولا يجوز نسخها أو إعادة استخدامها دون إذن خطي مسبق.
            </p>
          </Section>

          <Section title="٨. إخلاء المسؤولية">
            <p>
              نبذل قصارى جهدنا لتقديم نتائج تسويقية ممتازة، ولكن نتائج الحملات
              الإعلانية قد تتأثر بعوامل خارجية (السوق، المنافسة، جودة المنتج).
              لا نضمن أرقام مبيعات محددة، ولكن نضمن جودة التنفيذ والشفافية الكاملة.
            </p>
          </Section>

          <Section title="٩. إنهاء الخدمة">
            <p>
              يحق لك إلغاء اشتراكك في أي وقت دون أي رسوم. يحق لنا إيقاف حسابك
              في حال مخالفة هذه الشروط، مع إشعارك مسبقاً ومنحك فرصة للرد.
            </p>
          </Section>

          <Section title="١٠. القانون المُطبَّق">
            <p>
              تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وأي نزاع ينشأ
              يُحل وفقاً لاختصاص المحاكم السعودية المختصة.
            </p>
          </Section>

          <Section title="١١. تعديل الشروط">
            <p>
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات
              جوهرية عبر البريد الإلكتروني المسجل لديك.
            </p>
          </Section>

          <Section title="١٢. التواصل معنا">
            <p>
              لأي استفسار يخص هذه الشروط:{" "}
              <a href="mailto:info@almusawiq.com" className="text-primary underline">
                info@almusawiq.com
              </a>
            </p>
          </Section>
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-accent/30 p-6 text-center text-sm text-muted-foreground">
          هذه الشروط تخضع لأنظمة المملكة العربية السعودية 🇸🇦
        </div>
      </main>
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
