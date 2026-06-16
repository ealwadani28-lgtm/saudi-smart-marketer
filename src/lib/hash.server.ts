import { createHash } from "crypto";

const SALT = process.env.HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "lovable-default-salt";

/**
 * Stable, non-reversible hash for IPs and emails so we never store raw PII in
 * audit/telemetry tables. Same input always → same hash (lets us count
 * distinct visitors), but rainbow tables can't recover the original.
 */
export function hashWithSalt(value: string): string {
  return createHash("sha256").update(`${SALT}:${value}`).digest("hex").slice(0, 32);
}
