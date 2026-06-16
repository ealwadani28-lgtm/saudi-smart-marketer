import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  Mail,
  MessageCircle,
  Sparkles,
  Building2,
  ExternalLink,
} from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "الاشتراك الشهري — Justlator" },
      {
        name: "description",
        content:
          "اشترك في Justlator بـ 1500 ريال شهرياً. ادفع عبر PayPal أو تحويل بنكي مباشر، وسنفعّل حسابك خلال ساعات.",
      },
      { property: "og:title", content: "الاشتراك الشهري — Justlator" },
      {
        property: "og:description",
        content: "1500 ريال / شهر. PayPal أو تحويل بنكي مباشر للبنك الأهلي السعودي.",
      },
    ],
  }),
  component: SubscribePage,
});

const PRICE_SAR = 1500;
const PAYPAL_URL = "https://paypal.me/justlator";
const WHATSAPP_NUMBER = "96654681368"; // dolwya
const CONTACT_EMAIL = "contact@justlator.tech";

const BANK = {
  name: "البنك الأهلي السعودي (SNB)",
  iban: "SA9710000023800000395800",
  swift: "NCBKSAJE",
  beneficiary: "Essa Alwadani",
};

function buildWhatsappLink(method: "paypal" | "bank") {
  const label = method === "paypal" ? "PayPal" : "تحويل بنكي";
  const msg = `السلام عليكم،%0Aأرغب بتفعيل اشتراك Justlator الشهري (1500 ريال).%0Aطريقة الدفع: ${label}%0Aمرفق إيصال الدفع 👇`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function buildMailLink(method: "paypal" | "bank") {
  const label = method === "paypal" ? "PayPal" : "تحويل بنكي";
  const subject = encodeURIComponent(`تفعيل اشتراك Justlator — ${label}`);
  const body = encodeURIComponent(
    `السلام عليكم،\n\nأرغب بتفعيل اشتراك Justlator الشهري (1500 ريال).\nطريقة الدفع: ${label}\nمرفق إيصال الدفع.\n\nالاسم الكامل:\nالبريد الإلكتروني للحساب:\nرقم الجوال:\n`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function SubscribePage() {
  const [tab, setTab] = useState<"paypal" | "bank">("bank");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>العودة للرئيسية</span>
          </Link>
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Justlator
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            اشتراك Justlator الشهري
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            فعّل حسابك خلال ساعات
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-balance text-muted-foreground">
            خطة واحدة بكل المميزات. اختر طريقة الدفع المناسبة، أرسل إيصال
            التحويل، وسيصلك إيميل التأكيد بتاريخ بداية ونهاية الاشتراك.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr,1.4fr]">
          {/* Plan card */}
          <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm md:sticky md:top-6 md:self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">الخطة الشهرية</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                الأكثر طلباً
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight">
                {PRICE_SAR.toLocaleString("ar-SA")}
              </span>
              <span className="text-sm font-medium text-muted-foreground">ريال / شهر</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                "وصول كامل لكل مزايا Justlator",
                "تفعيل خلال ساعات بعد التحويل",
                "دعم مباشر عبر واتساب وإيميل",
                "إيقاف الاشتراك بأي وقت",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              بعد إرسال إيصال الدفع، سنفعّل حسابك ونرسل لك إيميل يحتوي تفاصيل
              الاشتراك (تاريخ البداية والنهاية وروابط الدخول).
            </div>
          </aside>

          {/* Payment methods */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">اختر طريقة الدفع</h2>

            <div className="mt-4 inline-flex rounded-lg border border-border bg-muted/40 p-1">
              <TabButton active={tab === "bank"} onClick={() => setTab("bank")}>
                <Building2 className="h-4 w-4" />
                تحويل بنكي
              </TabButton>
              <TabButton active={tab === "paypal"} onClick={() => setTab("paypal")}>
                <CreditCard className="h-4 w-4" />
                PayPal
              </TabButton>
            </div>

            {tab === "bank" ? (
              <div className="mt-6 space-y-3">
                <CopyRow
                  label="اسم البنك"
                  value={BANK.name}
                  onCopy={() => copy(BANK.name, "name")}
                  copied={copied === "name"}
                />
                <CopyRow
                  label="اسم المستفيد"
                  value={BANK.beneficiary}
                  onCopy={() => copy(BANK.beneficiary, "ben")}
                  copied={copied === "ben"}
                />
                <CopyRow
                  label="رقم الآيبان (IBAN)"
                  value={BANK.iban}
                  mono
                  onCopy={() => copy(BANK.iban, "iban")}
                  copied={copied === "iban"}
                />
                <CopyRow
                  label="رمز السويفت (SWIFT)"
                  value={BANK.swift}
                  mono
                  onCopy={() => copy(BANK.swift, "swift")}
                  copied={copied === "swift"}
                />
                <CopyRow
                  label="المبلغ"
                  value={`${PRICE_SAR} ريال`}
                  onCopy={() => copy(String(PRICE_SAR), "amt")}
                  copied={copied === "amt"}
                />

                <PaymentCTA method="bank" />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  ادفع <span className="font-semibold text-foreground">{PRICE_SAR} ريال</span>{" "}
                  (ما يعادلها بالدولار) عبر رابط PayPal الرسمي الخاص بنا، ثم
                  أرسل لنا لقطة من تأكيد العملية.
                </p>

                <a
                  href={PAYPAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#003087] text-white text-xs font-bold">
                      Pay<span className="text-[#009cde]">Pal</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">paypal.me/justlator</div>
                      <div className="text-xs text-muted-foreground">
                        ادفع مباشرة من حسابك
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </a>

                <PaymentCTA method="paypal" />
              </div>
            )}
          </section>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          أي استفسار؟ راسلنا على{" "}
          <a className="underline-offset-2 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </main>

      <JustlatorFooter />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CopyRow({
  label,
  value,
  mono,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div
          className={`mt-0.5 truncate text-sm font-medium ${mono ? "font-mono tracking-tight" : ""}`}
          dir={mono ? "ltr" : "auto"}
        >
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-primary" />
            تم النسخ
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            نسخ
          </>
        )}
      </button>
    </div>
  );
}

function PaymentCTA({ method }: { method: "paypal" | "bank" }) {
  return (
    <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="text-sm font-semibold">بعد الدفع، أرسل لنا الإيصال:</div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <a
          href={buildWhatsappLink(method)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          إرسال عبر واتساب
        </a>
        <a
          href={buildMailLink(method)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <Mail className="h-4 w-4" />
          إرسال عبر الإيميل
        </a>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        نراجع التحويل ونرسل لك إيميل تفعيل الاشتراك خلال ساعات عمل.
      </p>
    </div>
  );
}
