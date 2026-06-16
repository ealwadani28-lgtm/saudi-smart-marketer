import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Gift, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitEarlySignup } from "@/lib/signup.functions";
import { toast } from "sonner";

const STORAGE_KEY = "exit_intent_shown_v1";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const signupFn = useServerFn(submitEarlySignup);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 8000); // wait 8s before arming

    const onMouseLeave = (e: MouseEvent) => {
      if (!armed) return;
      if (e.clientY > 0) return;
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
      setOpen(true);
    };

    const onVisibility = () => {
      if (!armed) return;
      if (document.visibilityState === "hidden") {
        if (sessionStorage.getItem(STORAGE_KEY)) return;
        sessionStorage.setItem(STORAGE_KEY, "1");
        setOpen(true);
      }
    };

    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("الرجاء إدخال بريد إلكتروني صحيح");
      return;
    }
    setLoading(true);
    try {
      await signupFn({ data: { email, source: "exit_intent" } });
      setOpen(false);
      navigate({ to: "/thank-you" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ، حاول مرة أخرى";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          dir="rtl"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-muted/60 text-muted-foreground transition hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="bg-gradient-to-br from-primary/15 via-transparent to-gold/10 px-7 pb-6 pt-10 text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                عرض المؤسسين المبكر
              </div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Gift className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-bold leading-tight">
                لحظة قبل ما تروح! 🎁
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                سجّل بريدك الآن واحصل على{" "}
                <span className="font-bold text-foreground">خصم ٢٠٠ ريال</span>{" "}
                على أول حملة + <span className="font-bold text-foreground">تحليل مجاني لمتجرك</span>
              </p>
            </div>

            <form onSubmit={submit} className="px-7 pb-7">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>احجز عرضي الآن</>
                )}
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                بدون بطاقة • بدون التزام • إلغاء الاشتراك بأي وقت
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
