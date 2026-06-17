import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchStoreHtml, buildSnapshot, type StoreSnapshot } from "@/lib/analyzer.functions";

const UrlSchema = z
  .string()
  .trim()
  .min(4)
  .max(500)
  .transform((s) => (s.startsWith("http") ? s : `https://${s}`))
  .refine((s) => {
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "رابط غير صالح");

const AddInput = z.object({
  userId: z.string().uuid(),
  url: UrlSchema,
  name: z.string().trim().max(120).optional(),
});

const ListInput = z.object({ userId: z.string().uuid() });
const RemoveInput = z.object({ userId: z.string().uuid(), id: z.string().uuid() });

async function getActiveCustomer(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id, status")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("لم نجد مساحة عملك");
  if (data.status !== "active") throw new Error("اشتراكك غير مفعّل");
  return data;
}

function buildCompetitorSummary(s: StoreSnapshot): string {
  const parts: string[] = [];
  if (s.title) parts.push(s.title);
  if (s.products.length) parts.push(`${s.products.length} منتج`);
  const social = Object.keys(s.socialLinks).join("، ");
  if (social) parts.push(`موجود على: ${social}`);
  if (s.signals.hasOffers) parts.push("عنده عروض");
  return parts.join(" — ");
}

export const addCompetitor = createServerFn({ method: "POST" })
  .inputValidator((d) => AddInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const customer = await getActiveCustomer(data.userId);

    // Fetch & snapshot before insert so bad URLs fail fast
    const html = await fetchStoreHtml(data.url);
    const snapshot = buildSnapshot(html, data.url);
    const name = (data.name ?? snapshot.title ?? new URL(data.url).hostname).slice(0, 120);

    const { data: row, error } = await supabaseAdmin
      .from("competitors")
      .insert({
        customer_id: customer.id,
        competitor_url: data.url,
        competitor_name: name,
        source: "manual",
        last_checked_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("هذا المنافس مضاف من قبل");
      throw new Error(`فشل إضافة المنافس: ${error.message}`);
    }

    await supabaseAdmin.from("competitor_snapshots").insert({
      competitor_id: row.id,
      customer_id: customer.id,
      snapshot,
      summary: buildCompetitorSummary(snapshot),
    });

    return { id: row.id, name, snapshot };
  });

export const listCompetitors = createServerFn({ method: "POST" })
  .inputValidator((d) => ListInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const customer = await getActiveCustomer(data.userId);

    const { data: rows } = await supabaseAdmin
      .from("competitors")
      .select("id, competitor_url, competitor_name, active, last_checked_at, next_check_at, created_at")
      .eq("customer_id", customer.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    return { competitors: rows ?? [] };
  });

export const removeCompetitor = createServerFn({ method: "POST" })
  .inputValidator((d) => RemoveInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const customer = await getActiveCustomer(data.userId);

    // soft-delete: set active=false so history is preserved
    const { error } = await supabaseAdmin
      .from("competitors")
      .update({ active: false })
      .eq("id", data.id)
      .eq("customer_id", customer.id);
    if (error) throw new Error(`فشل الحذف: ${error.message}`);
    return { ok: true };
  });

// ============ Diff helper used by refresh route too ============

export type CompetitorChange = {
  productsAdded: string[];
  productsRemoved: string[];
  priceChanges: Array<{ name: string; from: string | null; to: string | null }>;
  newOffer: boolean;
  newSocial: string[];
};

export function diffSnapshots(prev: StoreSnapshot, next: StoreSnapshot): CompetitorChange {
  const prevNames = new Set(prev.products.map((p) => p.name));
  const nextNames = new Set(next.products.map((p) => p.name));
  const productsAdded = [...nextNames].filter((n) => !prevNames.has(n)).slice(0, 10);
  const productsRemoved = [...prevNames].filter((n) => !nextNames.has(n)).slice(0, 10);

  const priceChanges: CompetitorChange["priceChanges"] = [];
  const prevPrice = new Map(prev.products.map((p) => [p.name, p.price]));
  for (const p of next.products) {
    const old = prevPrice.get(p.name);
    if (old !== undefined && old !== p.price && (old || p.price)) {
      priceChanges.push({ name: p.name, from: old ?? null, to: p.price ?? null });
    }
  }

  const newOffer = !prev.signals.hasOffers && next.signals.hasOffers;
  const prevSocial = new Set(Object.keys(prev.socialLinks));
  const newSocial = Object.keys(next.socialLinks).filter((k) => !prevSocial.has(k));

  return { productsAdded, productsRemoved, priceChanges: priceChanges.slice(0, 8), newOffer, newSocial };
}

export function changeIsMeaningful(c: CompetitorChange): boolean {
  return (
    c.productsAdded.length > 0 ||
    c.productsRemoved.length > 0 ||
    c.priceChanges.length > 0 ||
    c.newOffer ||
    c.newSocial.length > 0
  );
}

export function changeToArabic(c: CompetitorChange, competitorName: string): string {
  const lines: string[] = [];
  if (c.productsAdded.length) lines.push(`أضاف ${c.productsAdded.length} منتج جديد: ${c.productsAdded.slice(0, 3).join("، ")}`);
  if (c.productsRemoved.length) lines.push(`حذف ${c.productsRemoved.length} منتج`);
  if (c.priceChanges.length) {
    const sample = c.priceChanges.slice(0, 2).map((p) => `${p.name} (${p.from ?? "؟"} → ${p.to ?? "؟"})`).join("، ");
    lines.push(`غيّر أسعار: ${sample}`);
  }
  if (c.newOffer) lines.push("أطلق عرضاً جديداً");
  if (c.newSocial.length) lines.push(`فعّل قنوات جديدة: ${c.newSocial.join("، ")}`);
  return `${competitorName}: ${lines.join(" • ")}`;
}
