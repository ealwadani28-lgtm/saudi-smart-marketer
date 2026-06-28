import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { JustlatorFooter } from "@/components/JustlatorFooter";
import { submitSubscriptionRequest } from "@/lib/subscription.functions";
import { submitPaymentProof } from "@/lib/payment-verify.functions";
import { Upload, AlertCircle, Sparkle } from "lucide-react";

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
const WHATSAPP_NUMBER = "96654681368";
const CONTACT_EMAIL = "contact@justlator.tech";

const BANK = {
  name: "البنك الأهلي السعودي (SNB)",
  iban: "SA9710000023800000395800",
  swift: "NCBKSAJE",
  beneficiary: "Essa Alwadani",
};

function buildWhatsappMessage(form: {
  full_name: string;
  email: string;
  phone: string;
  payment_method: "paypal" | "bank";
  reference?: string;
}) {
  const label = form.payment_method === "paypal" ? "PayPal" : "تحويل بنكي";
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
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    ادفع <span className="font-semibold text-foreground">{PRICE_SAR} ريال</span>{" "}
                    (ما يعادلها بالدولار) عبر رابط PayPal الرسمي الخاص بنا.
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
                          المستفيد: Essa Alwadani
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </a>
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

function RequestForm({ paymentMethod }: { paymentMethod: "paypal" | "bank" }) {
  const submitFn = useServerFn(submitSubscriptionRequest);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ waLink: string; requestId: string; email: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await submitFn({
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
      setSuccess({ waLink, requestId: result.id, email: email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">تم استلام طلبك بنجاح</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            ارفع إيصال الدفع الآن وسيتم{" "}
            <span className="font-semibold text-primary">تفعيل حسابك تلقائياً</span>{" "}
            خلال ثوانٍ بعد التحقق بالذكاء الاصطناعي.
          </p>
        </div>

        <ProofUploader requestId={success.requestId} email={success.email} />

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">أو أرسل الإيصال يدوياً:</p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-2">
            <a
              href={success.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              واتساب
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("إيصال دفع اشتراك Justlator")}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-muted"
            >
              <Mail className="h-3.5 w-3.5" />
              إيميل
            </a>
          </div>
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

function ProofUploader({ requestId, email }: { requestId: string; email: string }) {
  const uploadFn = useServerFn(submitPaymentProof);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; auto: boolean; message: string } | null>(null);
  const [err, setErr] = useState("");

  async function onUpload() {
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      if (file.size > 6 * 1024 * 1024) {
        throw new Error("الحد الأقصى ٦ ميجابايت");
      }
      const buf = await file.arrayBuffer();
      // Base64 encode in chunks to avoid call stack overflow
      const bytes = new Uint8Array(buf);
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);

      const res = await uploadFn({
        data: {
          subscriptionRequestId: requestId,
          email,
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          base64,
        },
      });
      setResult({ ok: true, auto: res.auto_verified, message: res.message });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  if (result?.auto) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20">
          <Sparkle className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-emerald-700 dark:text-emerald-400">
          🎉 تم التفعيل التلقائي!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground/80">{result.message}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          تحقق من بريدك <span className="font-mono">{email}</span> لرابط الدخول.
        </p>
      </div>
    );
  }

  if (result && !result.auto) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/20">
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>
        <h3 className="mt-4 text-base font-semibold">قيد المراجعة اليدوية</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Sparkle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">⚡ تفعيل فوري بالذكاء الاصطناعي</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            ارفع صورة الإيصال (أو PDF) — سيقرأه نظامنا تلقائياً، يتحقق من المبلغ
            والمستفيد، ويفعّل حسابك خلال ثوانٍ بدون انتظار.
          </p>
        </div>
      </div>

      <label
        className={`mt-4 block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,application/pdf"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setErr("");
          }}
        />
        <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
        <div className="mt-2 text-sm font-medium">
          {file ? file.name : "اضغط لاختيار ملف الإيصال"}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          PNG / JPG / WebP / HEIC / PDF — حتى ٦ ميجابايت
        </div>
      </label>

      {err && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {err}
        </div>
      )}

      <button
        type="button"
        onClick={onUpload}
        disabled={!file || uploading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ التحقق…
          </>
        ) : (
          <>
            <Sparkle className="h-4 w-4" />
            ارفع وفعّل حسابي تلقائياً
          </>
        )}
      </button>

      <p className="mt-2.5 text-center text-[10px] leading-relaxed text-muted-foreground">
        🔒 الإيصال مخزّن بشكل خاص ولا يُعرض إلا للأدمن.
      </p>
    </div>
  );
}
