import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Users, Activity } from "lucide-react";
import { pingVisitor } from "@/lib/telemetry.functions";

/**
 * Live visitor counter — pings the server every 30s and shows:
 *  - Active now (distinct IPs in last 5 minutes)
 *  - Today (distinct IPs since midnight UTC)
 */
export function LiveVisitorCounter({ path }: { path?: string }) {
  const ping = useServerFn(pingVisitor);
  const [activeNow, setActiveNow] = useState<number | null>(null);
  const [todayTotal, setTodayTotal] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await ping({ data: { path: path ?? null } });
        if (cancelled) return;
        setActiveNow((prev) => {
          if (prev !== null && prev !== res.activeNow) {
            setPulse(true);
            setTimeout(() => setPulse(false), 600);
          }
          return res.activeNow;
        });
        setTodayTotal(res.todayTotal);
      } catch {
        // silent — counter is non-essential
      }
    }

    tick();
    const id = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ping, path]);

  return (
    <div
      className="inline-flex items-center gap-3 rounded-full border border-border bg-card/80 px-4 py-2 text-sm shadow-sm backdrop-blur-md"
      dir="rtl"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 ${
              pulse ? "animate-ping" : ""
            }`}
          />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <Activity className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        <span className="font-medium text-foreground">
          {activeNow ?? "—"} <span className="text-muted-foreground">نشط الآن</span>
        </span>
      </div>
      <span className="h-4 w-px bg-border" aria-hidden="true" />
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {todayTotal ?? "—"} <span>اليوم</span>
        </span>
      </div>
    </div>
  );
}
