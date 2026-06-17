import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays, Sparkles, Instagram, Music2, Ghost,
  Twitter, ChevronDown, ChevronUp, Copy, Check,
} from "lucide-react";
import type { StoreReport } from "@/lib/analyzer.functions";
import { useServerFn } from "@tanstack/react-start";
import { generatePosts } from "@/lib/generate.functions";

// ── Platform config ───────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = {
  instagram: {
    label: "إنستقرام",
    icon: <Instagram className="h-4 w-4" />,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800",
  },
  tiktok: {
    label: "تيك توك",
    icon: <Music2 className="h-4 w-4" />,
    color: "text-foreground",
    bg: "bg-muted border-border",
  },
  snapchat: {
    label: "سناب شات",
    icon: <Ghost className="h-4 w-4" />,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800",
  },
  twitter: {
    label: "تويتر / X",
    icon: <Twitter className="h-4 w-4" />,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
  },
};

function getPlatformCfg(p: string) {
  return PLATFORM_CONFIG[p.toLowerCase()] ?? {
    label: p,
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-primary",
    bg: "bg-primary/5 border-primary/20",
  };
}

// ── Week grouping ─────────────────────────────────────────────────────────────

type DayItem = { day: number; platform: string; idea: string };

function groupByWeek(plan: DayItem[]): DayItem[][] {
  const weeks: DayItem[][] = [[], [], [], [], []];
  for (const item of plan) {
    const weekIdx = Math.min(Math.floor((item.day - 1) / 7), 4);
    weeks[weekIdx].push(item);
  }
  return weeks.filter((w) => w.length > 0);
}

// ── Day Card ──────────────────────────────────────────────────────────────────

function DayCard({ item, shopType }: { item: DayItem; shopType: string }) {
  const cfg = getPlatformCfg(item.platform);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [post, setPost] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const generate = useServerFn(generatePosts);

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      const res = await generate({
        data: {
          product: item.idea,
          audience: `عملاء متجر ${shopType}`,
          platform: item.platform as "tiktok" | "instagram" | "snapchat" | "twitter",
          tone: "friendly",
        },
      });
      const p = res.posts?.[0];
      setPost(p ? `${p.body}\n\n${p.hashtags.join(" ")}` : "");
      setExpanded(true);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!post) return;
    await navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`rounded-xl border ${cfg.bg} p-3 transition`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 grid h-7 w-7 place-items-center rounded-lg bg-background/60 ${cfg.color}`}>
            {cfg.icon}
          </span>
          <div className="min-w-0">
            <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
            <p className="text-sm leading-snug text-foreground line-clamp-2">{item.idea}</p>
          </div>
        </div>
        <button
          onClick={post ? () => setExpanded((v) => !v) : handleGenerate}
          disabled={generating}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 disabled:opacity-50"
        >
          {generating ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : post ? (
            expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {generating ? "جاري..." : post ? (expanded ? "إخفاء" : "عرض") : "اكتب"}
        </button>
      </div>

      {/* Generated post */}
      <AnimatePresence>
        {expanded && post && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-lg bg-background/80 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {post}
            </div>
            <button
              onClick={handleCopy}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "تم النسخ" : "نسخ المنشور"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {genError && <p className="mt-2 text-xs text-destructive">{genError}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ContentPlanView({
  contentPlan,
  shopType,
}: {
  contentPlan: NonNullable<StoreReport["contentPlan"]>;
  shopType: string;
}) {
  const weeks = groupByWeek(contentPlan);
  const [openWeek, setOpenWeek] = useState(0);

  const weekLabels = ["الأسبوع الأول", "الأسبوع الثاني", "الأسبوع الثالث", "الأسبوع الرابع", "الأسبوع الخامس"];

  // Platform summary counts
  const counts: Record<string, number> = {};
  for (const item of contentPlan) {
    const k = item.platform.toLowerCase();
    counts[k] = (counts[k] ?? 0) + 1;
  }

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([p, n]) => {
          const cfg = getPlatformCfg(p);
          return (
            <span
              key={p}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.bg} ${cfg.color}`}
            >
              {cfg.icon}
              {cfg.label} — {n} منشور
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {contentPlan.length} يوم
        </span>
      </div>

      {/* Weeks accordion */}
      {weeks.map((week, wi) => (
        <div key={wi} className="rounded-2xl border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenWeek(openWeek === wi ? -1 : wi)}
            className="flex w-full items-center justify-between bg-muted/40 px-5 py-3.5 text-right hover:bg-muted/60 transition"
          >
            <span className="font-bold">
              {weekLabels[wi] ?? `الأسبوع ${wi + 1}`}
              <span className="mr-2 text-xs font-normal text-muted-foreground">
                (يوم {week[0].day}–{week[week.length - 1].day})
              </span>
            </span>
            {openWeek === wi
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          <AnimatePresence initial={false}>
            {openWeek === wi && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                  {week.map((item) => (
                    <DayCard key={item.day} item={item} shopType={shopType} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
