import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { requestMagicLink } from "@/lib/customer.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "دخول مساحة العمل — المسوق الذكي" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const sendLink = useServerFn(requestMagicLink);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendLink({ data: { email: email.trim().toLowerCase() } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-white shadow-glow">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold">المسوق الذكي</h1>
          <p className="mt-2 text-sm text-muted-foreground">أدخل إيميلك وسنرسل لك رابط دخول مباشر</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h2 className="mt-4 font-display text-xl font-bold">تم الإرسال!</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                راجع بريدك الإلكتروني — رابط الدخول صالح لساعة واحدة.
                <br />
                لم يصلك شيء؟ تحقق من مجلد الـ Spam.
              </p>
              <button
                onClick={() => { setDone(false); setEmail(""); }}
                className="mt-6 text-sm text-primary underline-offset-2 hover:underline"
              >
                أرسل مرة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="بريدك الإلكتروني"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3.5 pr-12 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "جاري الإرسال..." : "أرسل رابط الدخول"}
                {!loading && <ArrowLeft className="h-5 w-5" />}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          لست عميلاً بعد؟{" "}
          <Link to="/subscribe" className="font-bold text-primary hover:underline">
            اشترك الآن
          </Link>
        </p>
      </div>
    </div>
  );
}
