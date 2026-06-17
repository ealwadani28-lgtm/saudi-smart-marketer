import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Mail,
  MessageCircle,
  Sparkles,
  Building2,
  Loader2,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";
import { submitSubscriptionRequest } from "@/lib/subscription.functions";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "الاشتراك الشهري — Justlator" },
      {
        name: "description",
        content:
          "اشترك في Justlator بـ 1500 ريال شهرياً. ادفع عبر تحويل بنكي أو STC Pay، وسنفعّل حسابك خلال ساعات.",
      },
      { property: "og:title", content: "الاشتراك الشهري — Justlator" },
      {
        property: "og:description",
        content: "1500 ريال / شهر. تحويل بنكي مباشر أو STC Pay.",
      },
    ],
  }),
  component: SubscribePage,
});

const PRICE_SAR = 1500;
const WHATSAPP_NUMBER = "96654681368";
const CONTACT_EMAIL = "contact@justlator.tech";
type PaymentMethod = "bank" | "stc_pay";

const BANK = {
  name: "البنك الأهلي السعودي (SNB)",
  iban: "SA9710000023800000395800",
  swift: "NCBKSAJE",
  beneficiary: "Essa Alwadani",
};

const STC_PAY = {
  phone: "+96654681368",
  beneficiary: "Essa Alwadani",
};

function buildWhatsappMessage(form: {
  full_name: string;
  email: string;
  phone: string;
  payment_method: PaymentMethod;
  reference?: string;
}) {
  const label = form.payment_method === "stc_pay" ? "STC Pay" : "تحويل بنكي";
  const lines = [
    "السلام عليكم،",
    `أرغب بتفعيل اشتراك Justlator الشهري (${PRICE_SAR} ريال).`,
    `الاسم: ${form.full_name}`,
    `الإيميل: ${form.email}`,
    form.phone ? `الجوال: ${form.phone}` : "",
    `طريقة الدفع: ${label}`,
    form.reference ? `رقم العملية: ${form.reference}` : "",
    "مرفق إيصال الدفع 👇",
  ].filter(Boolean);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function SubscribePage() {
  const [tab, setTab] = useState<PaymentMethod>("bank");
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
            ادفع بطريقتك المفضلة، ثم عبّئ النموذج وسيصلك إيميل تفعيل الاشتراك
            بتاريخ البداية والنهاية بعد مراجعة التحويل.
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
              بعد إرسال طلبك، سنفعّل حسابك ونرسل لك إيميل يحتوي تفاصيل الاشتراك
              (تاريخ البداية والنهاية وروابط الدخول) على{" "}
              <span className="font-medium text-foreground">{CONTACT_EMAIL}</span>.
            </div>
          </aside>

          {/* Payment + Form */}
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">١. اختر طريقة الدفع</h2>
                <span className="text-xs font-medium text-muted-foreground">
                  المبلغ: <span className="text-foreground">{PRICE_SAR} ريال</span>
                </span>
              </div>

              <div className="mt-4 inline-flex rounded-lg border border-border bg-muted/40 p-1">
                <TabButton active={tab === "bank"} onClick={() => setTab("bank")}>
                  <Building2 className="h-4 w-4" />
                  تحويل بنكي
                </TabButton>
                <TabButton active={tab === "stc_pay"} onClick={() => setTab("stc_pay")}>
                  <Smartphone className="h-4 w-4" />
                  STC Pay
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
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <CopyRow
                    label="رقم STC Pay"
                    value={STC_PAY.phone}
                    mono
                    onCopy={() => copy(STC_PAY.phone, "stc-phone")}
                    copied={copied === "stc-phone"}
                  />
                  <CopyRow
                    label="اسم المستفيد"
                    value={STC_PAY.beneficiary}
                    onCopy={() => copy(STC_PAY.beneficiary, "stc-ben")}
                    copied={copied === "stc-ben"}
                  />
                </div>
              )}
            </div>

            <RequestForm paymentMethod={tab} />
          </section>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          أي استفسار؟ راسلنا على{" "}
          <a className="underline-offset-2 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          أو واتساب{" "}
          <a
            className="underline-offset-2 hover:underline"
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            مباشر
          </a>
        </p>
      </main>

      <JustlatorFooter />
    </div>
  );
}

function RequestForm({ paymentMethod }: { paymentMethod: PaymentMethod }) {
  const submitFn = useServerFn(submitSubscriptionRequest);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ waLink: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await submitFn({
        data: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          payment_method: paymentMethod,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        },
      });
      const waLink = buildWhatsappMessage({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        payment_method: paymentMethod,
        reference: reference.trim(),
      });
      setSuccess({ waLink });
      // Auto-open WhatsApp
      window.open(waLink, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">تم استلام طلبك بنجاح</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          مبلغ الاشتراك:{" "}
          <span className="font-semibold text-foreground">
            {PRICE_SAR.toLocaleString("ar-SA")} ريال
          </span>
          . أرسل لنا إيصال الدفع عبر واتساب لتسريع التفعيل. سنرسل إيميل تأكيد
          الاشتراك خلال ساعات عمل.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <a
            href={success.waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            فتح واتساب لإرسال الإيصال
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("إيصال دفع اشتراك Justlator")}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Mail className="h-4 w-4" />
            إرسال الإيصال بالإيميل
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold">٢. أرسل طلب الاشتراك</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        بعد إرسال النموذج سيفتح واتساب تلقائياً بكل التفاصيل لإرفاق الإيصال.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="الاسم الكامل" required>
          <input
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="الاسم كما تريد أن يظهر بالفاتورة"
          />
        </Field>

        <Field label="البريد الإلكتروني" required>
          <input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="you@example.com"
            dir="ltr"
          />
        </Field>

        <Field label="رقم الجوال (واتساب)">
          <input
            type="tel"
            maxLength={40}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="05XXXXXXXX"
            dir="ltr"
          />
        </Field>

        <Field
          label={
            paymentMethod === "paypal" ? "رقم عملية PayPal (اختياري)" : "رقم مرجع التحويل (اختياري)"
          }
        >
          <input
            type="text"
            maxLength={200}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={paymentMethod === "paypal" ? "Transaction ID" : "مرجع التحويل البنكي"}
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="ملاحظات (اختياري)" className="mt-4">
        <textarea
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="اسم المتجر، أي طلب خاص، إلخ"
        />
      </Field>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ الإرسال…
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4" />
            إرسال الطلب وفتح واتساب
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
        بالضغط أعلاه أوافق على{" "}
        <Link to="/terms" className="underline-offset-2 hover:underline">
          الشروط
        </Link>{" "}
        و
        <Link to="/privacy" className="underline-offset-2 hover:underline">
          سياسة الخصوصية
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-xs font-medium text-foreground/80">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
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
