import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles, LogOut, CheckCircle2, Clock, AlertCircle,
  Store, CalendarDays, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspace } from "@/lib/customer.functions";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "مساحة عملك — المسوق الذكي" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WorkspacePage,
});

type Update = {
  id: string;
  type: string;
  title: string;
  body: string;
  done: boolean;
  created_at: string;
};

type Customer = {
  full_name: string;
  shop_url: string | null;
  shop_name: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  status: string;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  welcome:    <Sparkles className="h-5 w-5 text-primary" />,
  analysis:   <Store className="h-5 w-5 text-gold" />,
  plan:       <CalendarDays className="h-5 w-5 text-success" />,
  post:       <CheckCircle2 className="h-5 w-5 text-success" />,
  report:     <ChevronRight className="h-5 w-5 text-primary" />,
  alert:      <AlertCircle className="h-5 w-5 text-destructive" />,
};

function daysLeft(end: string | null) {
  if (!end) return null;
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
}

function WorkspacePage() {
  const navigate = useNavigate();
  const fetchWorkspace = useServerFn(getWorkspace);

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const res = await fetchWorkspace({ data: { userId: session.user.id } });
        setCustomer(res.customer);
        setUpdates(res.updates);
      } catch (e) {
        setError(e instanceof Error ? e.message : "حدث خطأ");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="h-5 w-5 animate-pulse text-primary" />
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-4 font-bold">{error}</p>
          <button onClick={signOut} className="mt-4 text-sm text-muted-foreground underline-offset-2 hover:underline">
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  const days = daysLeft(customer?.subscription_end ?? null);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-primary">المسوق الذكي</span>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-2xl font-bold md:text-3xl">
            أهلاً، {customer?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">هذي مساحة عملك — كل شيء موثّق هنا بشفافية كاملة.</p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 grid gap-4 sm:grid-cols-3"
        >
          <StatCard
            icon={<CalendarDays className="h-5 w-5 text-primary" />}
            label="بداية الاشتراك"
            value={customer?.subscription_start ? formatDate(customer.subscription_start) : "—"}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-gold" />}
            label="الأيام المتبقية"
            value={days !== null ? `${days} يوم` : "—"}
            highlight={days !== null && days <= 5}
          />
          <StatCard
            icon={<Store className="h-5 w-5 text-success" />}
            label="متجرك"
            value={customer?.shop_name ?? customer?.shop_url ?? "لم يُحدَّد بعد"}
            small
          />
        </motion.div>

        {/* Updates feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10"
        >
          <h2 className="mb-5 font-display text-lg font-bold">سجل العمل</h2>

          {updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center text-muted-foreground">
              <Clock className="mx-auto mb-3 h-8 w-8 opacity-40" />
              سيظهر هنا كل تحديث فور اكتماله
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className={`flex gap-4 rounded-2xl border p-5 ${
                    u.done
                      ? "border-success/20 bg-success/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {u.done
                      ? <CheckCircle2 className="h-5 w-5 text-success" />
                      : (TYPE_ICON[u.type] ?? <Clock className="h-5 w-5 text-muted-foreground" />)
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-snug">{u.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(u.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{u.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          أي سؤال؟ راسلنا على{" "}
          <a href="mailto:contact@justlator.tech" className="underline-offset-2 hover:underline">
            contact@justlator.tech
          </a>
        </p>
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, highlight, small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-gold/40 bg-gold/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`mt-2 font-bold ${small ? "text-sm" : "text-xl"} ${highlight ? "text-gold" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
