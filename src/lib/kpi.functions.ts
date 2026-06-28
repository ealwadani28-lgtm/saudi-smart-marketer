import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED_SOURCES = [
  "meta_ads",
  "tiktok_ads",
  "google_ads",
  "snapchat_ads",
  "x_ads",
  "ga4",
  "search_console",
  "shopify",
  "salla",
  "zid",
  "manual_dashboard",
] as const;

export type KpiSource = (typeof ALLOWED_SOURCES)[number];

export type KpiEntry = {
  id: string;
  customer_id: string;
  marketing_plan_id: string | null;
  period_start: string;
  period_end: string;
  channel: string;
  views: number;
  clicks: number;
  conversions: number;
  cost_sar: number;
  source: KpiSource;
  evidence_url: string;
  notes: string | null;
  entered_by: string;
  entry_hash: string;
  sealed_at: string;
  created_at: string;
};

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ يجب أن تكون YYYY-MM-DD");

const AddInput = z.object({
  token: z.string().min(8).max(512),
  email: z.string().email().max(256),
  marketingPlanId: z.string().uuid().optional().nullable(),
  periodStart: dateStr,
  periodEnd: dateStr,
  channel: z.string().trim().min(1).max(60).default("all"),
  views: z.number().int().min(0).max(1_000_000_000),
  clicks: z.number().int().min(0).max(1_000_000_000),
  conversions: z.number().int().min(0).max(1_000_000_000),
  costSar: z.number().min(0).max(10_000_000),
  source: z.enum(ALLOWED_SOURCES),
  evidenceUrl: z
    .string()
    .trim()
    .url("رابط الإثبات غير صالح")
    .max(2000)
    .refine((u) => /^https?:\/\//i.test(u), "يجب أن يبدأ بـ http(s)"),
  notes: z.string().max(500).optional().nullable(),
});

const ListByEmailInput = z.object({
  token: z.string().min(8).max(512),
  email: z.string().email().max(256),
  marketingPlanId: z.string().uuid().optional().nullable(),
});

const ListByUserInput = z.object({
  userId: z.string().uuid(),
  marketingPlanId: z.string().uuid().optional().nullable(),
});

export const adminAddKpiEntry = createServerFn({ method: "POST" })
  .inputValidator((d) => AddInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    if (new Date(data.periodEnd) < new Date(data.periodStart)) {
      throw new Error("نهاية الفترة قبل بدايتها");
    }
    if (data.clicks > data.views && data.views > 0) {
      throw new Error("النقرات لا يمكن أن تتجاوز المشاهدات");
    }
    if (data.conversions > data.clicks && data.clicks > 0) {
      throw new Error("التحويلات لا يمكن أن تتجاوز النقرات");
    }

    const { data: customer, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!customer) throw new Error("لم نجد عميلاً بهذا البريد");

    const { data: row, error } = await supabaseAdmin
      .from("kpi_entries")
      .insert({
        customer_id: customer.id,
        marketing_plan_id: data.marketingPlanId ?? null,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        channel: data.channel,
        views: data.views,
        clicks: data.clicks,
        conversions: data.conversions,
        cost_sar: data.costSar,
        source: data.source,
        evidence_url: data.evidenceUrl,
        notes: data.notes ?? null,
        entered_by: `admin:${data.email}`,
        // entry_hash & sealed_at are overwritten by the BEFORE INSERT trigger
        entry_hash: "pending",
      })
      .select("id, entry_hash, sealed_at")
      .single();
    if (error) throw new Error(`فشل حفظ السجل: ${error.message}`);

    return { id: row.id, entryHash: row.entry_hash, sealedAt: row.sealed_at };
  });

// ---------- bulk import from platform CSV ----------

const BulkRow = z.object({
  periodStart: dateStr,
  periodEnd: dateStr,
  channel: z.string().trim().min(1).max(60),
  views: z.number().int().min(0).max(1_000_000_000),
  clicks: z.number().int().min(0).max(1_000_000_000),
  conversions: z.number().int().min(0).max(1_000_000_000),
  costSar: z.number().min(0).max(10_000_000),
});

const BulkInput = z.object({
  token: z.string().min(8).max(512),
  email: z.string().email().max(256),
  marketingPlanId: z.string().uuid().optional().nullable(),
  source: z.enum(ALLOWED_SOURCES),
  evidenceUrl: z
    .string()
    .trim()
    .url("رابط الإثبات غير صالح")
    .max(2000)
    .refine((u) => /^https?:\/\//i.test(u), "يجب أن يبدأ بـ http(s)"),
  fileName: z.string().trim().min(1).max(300),
  fileHash: z.string().regex(/^[a-f0-9]{64}$/i, "بصمة الملف يجب أن تكون SHA-256 hex"),
  rows: z.array(BulkRow).min(1).max(500),
});

export const adminBulkImportKpi = createServerFn({ method: "POST" })
  .inputValidator((d) => BulkInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const { data: customer, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!customer) throw new Error("لم نجد عميلاً بهذا البريد");

    // Validate row-level invariants up front so nothing partial is committed.
    for (const [i, r] of data.rows.entries()) {
      if (new Date(r.periodEnd) < new Date(r.periodStart)) {
        throw new Error(`السطر ${i + 1}: نهاية الفترة قبل بدايتها`);
      }
      if (r.clicks > r.views && r.views > 0) {
        throw new Error(`السطر ${i + 1}: النقرات تتجاوز المشاهدات`);
      }
      if (r.conversions > r.clicks && r.clicks > 0) {
        throw new Error(`السطر ${i + 1}: التحويلات تتجاوز النقرات`);
      }
    }

    const proofTag = `[auto-import] ${data.source} • file=${data.fileName} • sha256=${data.fileHash}`;
    const payload = data.rows.map((r) => ({
      customer_id: customer.id,
      marketing_plan_id: data.marketingPlanId ?? null,
      period_start: r.periodStart,
      period_end: r.periodEnd,
      channel: r.channel,
      views: r.views,
      clicks: r.clicks,
      conversions: r.conversions,
      cost_sar: r.costSar,
      source: data.source,
      evidence_url: data.evidenceUrl,
      notes: proofTag,
      entered_by: `admin-import:${data.email}`,
      entry_hash: "pending",
    }));

    const { data: rows, error } = await supabaseAdmin
      .from("kpi_entries")
      .insert(payload)
      .select("id");
    if (error) throw new Error(`فشل الاستيراد: ${error.message}`);
    return { inserted: rows?.length ?? 0, fileHash: data.fileHash };


export const adminListKpiEntries = createServerFn({ method: "POST" })
  .inputValidator((d) => ListByEmailInput.parse(d))
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("./admin-token.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (!customer) return { entries: [] as KpiEntry[] };

    let q = supabaseAdmin
      .from("kpi_entries")
      .select("*")
      .eq("customer_id", customer.id)
      .order("period_start", { ascending: false })
      .limit(500);
    if (data.marketingPlanId) q = q.eq("marketing_plan_id", data.marketingPlanId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { entries: (rows ?? []) as KpiEntry[] };
  });

export const listKpiEntries = createServerFn({ method: "POST" })
  .inputValidator((d) => ListByUserInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!customer) return { entries: [] as KpiEntry[] };

    let q = supabaseAdmin
      .from("kpi_entries")
      .select("*")
      .eq("customer_id", customer.id)
      .order("period_start", { ascending: false })
      .limit(500);
    if (data.marketingPlanId) q = q.eq("marketing_plan_id", data.marketingPlanId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { entries: (rows ?? []) as KpiEntry[] };
  });

// ---------- shared client-safe helpers (pure) ----------

export type KpiAggregate = {
  views: number;
  clicks: number;
  conversions: number;
  costSar: number;
  ctr: number;     // %
  cvr: number;     // %
  cpc: number;     // SAR
  cpa: number;     // SAR
};

export function aggregateKpis(entries: KpiEntry[]): KpiAggregate {
  const t = entries.reduce(
    (acc, e) => {
      acc.views += Number(e.views) || 0;
      acc.clicks += Number(e.clicks) || 0;
      acc.conversions += Number(e.conversions) || 0;
      acc.costSar += Number(e.cost_sar) || 0;
      return acc;
    },
    { views: 0, clicks: 0, conversions: 0, costSar: 0 },
  );
  return {
    ...t,
    ctr: t.views > 0 ? (t.clicks / t.views) * 100 : 0,
    cvr: t.clicks > 0 ? (t.conversions / t.clicks) * 100 : 0,
    cpc: t.clicks > 0 ? t.costSar / t.clicks : 0,
    cpa: t.conversions > 0 ? t.costSar / t.conversions : 0,
  };
}

/** Extract first numeric value from a free-text target ("100 طلب", "1.5%", "ROAS 3x"). */
export function parseTargetNumber(target: string): { value: number; isPercent: boolean } | null {
  const m = target.match(/(-?\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  if (!isFinite(v)) return null;
  return { value: v, isPercent: /%/.test(target) };
}

/**
 * Match a plan KPI to a computed metric and return progress 0-100.
 * Heuristic, conservative — falls back to null if it can't match.
 */
export function computeKpiProgress(
  kpiName: string,
  target: string,
  agg: KpiAggregate,
): { actual: number; targetValue: number; percent: number; unit: string } | null {
  const parsed = parseTargetNumber(target);
  if (!parsed) return null;
  const name = kpiName.toLowerCase();

  let actual: number | null = null;
  let unit = "";

  if (/(ctr|نقر)/i.test(name)) { actual = agg.ctr; unit = "%"; }
  else if (/(cvr|conversion rate|تحويل\s*%|معدل\s*التحويل)/i.test(name)) { actual = agg.cvr; unit = "%"; }
  else if (/(cpa|cost per acquisition|تكلفة\s*التحويل)/i.test(name)) { actual = agg.cpa; unit = "ر.س"; }
  else if (/(cpc|cost per click|تكلفة\s*النقرة)/i.test(name)) { actual = agg.cpc; unit = "ر.س"; }
  else if (/(impressions|مشاهد|ظهور)/i.test(name)) { actual = agg.views; unit = ""; }
  else if (/(clicks|نقرات)/i.test(name)) { actual = agg.clicks; unit = ""; }
  else if (/(conversions|طلبات|مبيعات|تحويلات|اشتراكات)/i.test(name)) { actual = agg.conversions; unit = ""; }
  else if (/(spend|ميزانية|تكلفة|انفاق|إنفاق)/i.test(name)) { actual = agg.costSar; unit = "ر.س"; }

  if (actual == null) return null;

  // Lower-is-better metrics
  const lowerBetter = /(cpa|cpc|تكلفة)/i.test(name);
  const percent = lowerBetter
    ? parsed.value > 0 ? Math.max(0, Math.min(200, (parsed.value / Math.max(actual, 0.0001)) * 100)) : 0
    : parsed.value > 0 ? Math.max(0, Math.min(200, (actual / parsed.value) * 100)) : 0;

  return { actual, targetValue: parsed.value, percent, unit: unit || (parsed.isPercent ? "%" : "") };
}
