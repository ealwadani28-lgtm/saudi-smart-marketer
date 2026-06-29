import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة — المسوق الذكي" },
      {
        name: "description",
        content:
          "إجابات صريحة حول طريقة عمل المسوق الذكي، السعر، الضمانات، إلغاء الاشتراك، الفرق عن الوكالات، ودعم متاجر سلة وزد.",
      },
      { property: "og:title", content: "الأسئلة الشائعة — المسوق الذكي" },
      {
        property: "og:description",
        content: "كل ما تحتاج معرفته قبل الاشتراك في خدمة المسوق الذكي للمتاجر السعودية.",
      },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
  }),
  component: FaqPage,
});

const CATEGORIES: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "الخدمة وآلية العمل",
    items: [
      {
        q: "ما الذي أحصل عليه فعلياً مقابل 1,500 ريال شهرياً؟",
        a: "خطة تسويق شهرية كاملة باللغة العربية مبنية على تحليل متجرك: تقويم محتوى 30 يوم، 12-20 منشور جاهز للنشر، توصيات حملات إعلانية، تتبع KPIs، وتحديث الخطة كل أسبوع. أنت تنشر بنفسك (أو فريقك)، ونحن نوفر المحتوى والإستراتيجية.",
      },
      {
        q: "هل تنشرون نيابةً عني على حساباتي؟",
        a: "لا. حالياً نولّد لك المحتوى والخطة وأنت تنشر. النشر التلقائي عبر Meta وGoogle ضمن خارطة طموحنا وسنطلقه لاحقاً. نختار هذا النموذج لتفادي التزامات تشغيلية تخفض جودة الخدمة.",
      },
      {
        q: "كم تستغرق المدة قبل أن أرى الخطة الأولى؟",
        a: "خلال 24-48 ساعة من تأكيد الدفع. التحليل التلقائي للمتجر يستغرق دقائق، ومراجعة الخطة وتنقيحها تتم خلال يوم عمل واحد.",
      },
      {
        q: "هل أحصل على تقارير دورية؟",
        a: "نعم. لوحة KPIs محدّثة لحظياً + تقرير شهري PDF مع تحليل الأداء والتوصيات للشهر التالي.",
      },
    ],
  },
  {
    title: "الدفع والاشتراك",
    items: [
      {
        q: "ما طرق الدفع المتاحة؟",
        a: "تحويل بنكي مباشر (الراجحي / الأهلي) أو PayPal. بعد التحويل ترسل الإيصال عبر واتساب ويتم تفعيل اشتراكك خلال ساعات.",
      },
      {
        q: "هل يوجد عقد أو التزام طويل؟",
        a: "لا. الاشتراك شهري بدون عقود. تلغي متى ما أردت دون رسوم أو شروط.",
      },
      {
        q: "هل ترجعون المبلغ إذا لم تعجبني الخدمة؟",
        a: "نعم. خلال أول 7 أيام إذا لم تستلم خطة كاملة أو لم تكن راضياً عن الجودة، نرجع المبلغ كاملاً بدون أسئلة.",
      },
      {
        q: "هل السعر يشمل ميزانية الإعلانات؟",
        a: "لا. 1,500 ريال هي تكلفة الخدمة فقط (تحليل + خطة + محتوى + متابعة). ميزانية إعلانات Meta/Google تدفعها مباشرة للمنصات. نوصي بـ 1,000-3,000 ريال شهرياً كبداية حسب فئتك.",
      },
    ],
  },
  {
    title: "النتائج والضمانات",
    items: [
      {
        q: "هل تضمنون مبيعات أو عدد طلبات؟",
        a: "لا نضمن أرقام مبيعات — أي وكالة تضمن ذلك تكذب عليك. نضمن جودة المحتوى والإستراتيجية، ووضوح القياس عبر KPIs، وحاسبة تعادل شفافة تريك متى يصبح الاشتراك مربحاً لك.",
      },
      {
        q: "أين قصص نجاح العملاء؟",
        a: "نحن في مرحلة الإطلاق المبكر. بدلاً من فبركة شهادات وهمية، نعرض كيف يعمل النظام بشفافية كاملة عبر صفحة 'كيف يعمل' و'معاينة الحملة' لتقرر بنفسك.",
      },
      {
        q: "متى أبدأ برؤية نتائج فعلية؟",
        a: "أول إشارات تفاعل خلال 7-14 يوم. نتائج مبيعات قابلة للقياس عادة بين 30-60 يوم حسب فئة المنتج، التسعير، وميزانية الإعلانات.",
      },
    ],
  },
  {
    title: "المنصات والتقنية",
    items: [
      {
        q: "هل تدعمون متاجر سلة وزد؟",
        a: "نعم، الاثنتان مدعومتان كلياً في التحليل وتوليد المحتوى. نقرأ المنتجات والتصنيفات والأسعار تلقائياً من رابط متجرك.",
      },
      {
        q: "ماذا عن المتاجر على Shopify أو WooCommerce؟",
        a: "ندعمها بشكل أساسي لكن بعض ميزات التحليل العميق قد تكون محدودة. نوصي بتجربة التحليل المجاني أولاً للتأكد.",
      },
      {
        q: "هل بياناتي ومعلومات متجري محمية؟",
        a: "نعم. لا نشارك بياناتك مع أي طرف ثالث، نستخدم تشفير على مستوى البنوك، ولا نحتاج صلاحيات دخول لمتجرك — فقط الرابط العام.",
      },
    ],
  },
  {
    title: "الفرق عن البدائل",
    items: [
      {
        q: "ما الفرق بيننا وبين وكالة تسويق تقليدية؟",
        a: "الوكالات: 5,000-20,000 ريال شهرياً + عقد 6 أشهر + وعود مبهمة. نحن: 1,500 ريال + بدون عقد + شفافية كاملة + خطة قابلة للقياس + أنت تتحكم.",
      },
      {
        q: "لماذا لا أستخدم ChatGPT مباشرة؟",
        a: "ChatGPT يولد نصاً عاماً. نحن نحلل متجرك تحديداً (منتجاتك، أسعارك، منافسيك في السوق السعودي)، نبني خطة مبنية على بيانات، ونتابع KPIs، ونحدّث الإستراتيجية شهرياً بناءً على نتائجك.",
      },
    ],
  },
];

function FaqPage() {
  // JSON-LD لمحركات البحث
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: CATEGORIES.flatMap((cat) =>
      cat.items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-base font-bold text-primary">
            المسوّق الذكي
          </Link>
          <Link
            to="/subscribe"
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
          >
            ابدأ الآن
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-white">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">الأسئلة الشائعة</h1>
          <p className="mt-3 text-muted-foreground">
            إجابات صريحة قبل ما تشترك — بدون مبالغات تسويقية.
          </p>
        </div>

        <div className="space-y-8">
          {CATEGORIES.map((cat) => (
            <section key={cat.title}>
              <h2 className="mb-3 font-display text-xl font-bold text-primary">{cat.title}</h2>
              <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-card/50 px-4">
                {cat.items.map((item, idx) => (
                  <AccordionItem key={idx} value={`${cat.title}-${idx}`} className="border-border/60">
                    <AccordionTrigger className="text-right text-base font-semibold hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-7">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="font-display text-lg font-bold">سؤالك مو موجود؟</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            راسلنا مباشرة وراح نرد عليك خلال ساعات.
          </p>
          <a
            href="https://wa.me/966500000000"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary/40 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            واتساب
          </a>
        </div>
      </main>

      <JustlatorFooter />
    </div>
  );
}
