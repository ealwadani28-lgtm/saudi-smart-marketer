import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

export function getClientIp(): string {
  try {
    const cf = getRequestHeader("cf-connecting-ip");
    if (cf) return cf;
    const xff = getRequestHeader("x-forwarded-for");
    if (xff) return xff.split(",")[0]!.trim();
    const real = getRequestHeader("x-real-ip");
    if (real) return real;
    const ip = getRequestIP({ xForwardedFor: true });
    if (ip) return ip;
  } catch {
    // outside server context
  }
  return "unknown";
}

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfter: number };

/**
 * Atomic fixed-window rate limit backed by public.rl_hit().
 * Fails open on infrastructure errors so the app stays usable.
 */
export async function rateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = `${scope}:${identifier}`;
  try {
    const { data, error } = await supabaseAdmin.rpc("rl_hit", {
      _key: key,
      _limit: limit,
      _window_seconds: windowSeconds,
    });
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return { allowed: true, remaining: limit, retryAfter: 0 };
    }
    const row = data[0] as { allowed: boolean; remaining: number; retry_after: number };
    return { allowed: !!row.allowed, remaining: row.remaining ?? 0, retryAfter: row.retry_after ?? 0 };
  } catch {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}
