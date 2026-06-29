import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TokenInput = z.object({ token: z.string().min(8).max(512) });

const DomainRegex = /^(?!-)[a-zA-Z0-9-]{1,63}(\.[a-zA-Z0-9-]{1,63})+$/;

const AddDomainInput = z.object({
  token: z.string().min(8).max(512),
  domain: z.string().trim().toLowerCase().min(3).max(253).regex(DomainRegex, "صيغة دومين غير صحيحة"),
  label: z.string().trim().max(120).optional().nullable(),
});

const IdInput = z.object({
  token: z.string().min(8).max(512),
  id: z.string().uuid(),
});

const ScansInput = z.object({
  token: z.string().min(8).max(512),
  domainId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

async function assertAdmin(token: string) {
  const { verifyAdminToken } = await import("./admin-token.server");
  if (!verifyAdminToken(token)) throw new Error("Unauthorized");
}

export const adminListMonitoredDomains = createServerFn({ method: "POST" })
  .inputValidator((d) => TokenInput.parse(d))
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: domains, error } = await supabaseAdmin
      .from("monitored_domains")
      .select("id, domain, label, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { domains: domains ?? [] };
  });

export const adminAddMonitoredDomain = createServerFn({ method: "POST" })
  .inputValidator((d) => AddDomainInput.parse(d))
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("monitored_domains")
      .insert({ domain: data.domain, label: data.label ?? null })
      .select("id, domain, label, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { domain: row };
  });

export const adminRemoveMonitoredDomain = createServerFn({ method: "POST" })
  .inputValidator((d) => IdInput.parse(d))
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("monitored_domains").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListDomainScans = createServerFn({ method: "POST" })
  .inputValidator((d) => ScansInput.parse(d))
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("domain_scans")
      .select("id, domain_id, domain, source, status, grade, has_warnings, cert_subject, cert_issuer, cert_valid_from, cert_valid_to, protocols, error, started_at, completed_at")
      .order("started_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.domainId) q = q.eq("domain_id", data.domainId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { scans: rows ?? [] };
  });

const RunScanInput = z.object({
  token: z.string().min(8).max(512),
  id: z.string().uuid(),
});

type SslLabsEndpoint = {
  ipAddress?: string;
  grade?: string;
  hasWarnings?: boolean;
  details?: {
    cert?: {
      subject?: string;
      issuerSubject?: string;
      notBefore?: number;
      notAfter?: number;
    };
    protocols?: { name: string; version: string }[];
  };
};

type SslLabsResult = {
  status: "DNS" | "IN_PROGRESS" | "READY" | "ERROR";
  statusMessage?: string;
  endpoints?: SslLabsEndpoint[];
};

async function pollSslLabs(host: string, signal: AbortSignal): Promise<SslLabsResult> {
  // Start a new scan
  const startUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(host)}&startNew=on&all=done&ignoreMismatch=on`;
  await fetch(startUrl, { signal });

  const pollUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(host)}&all=done`;
  const deadline = Date.now() + 3 * 60 * 1000; // 3 minutes max
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 12_000));
    const res = await fetch(pollUrl, { signal });
    if (!res.ok) continue;
    const json = (await res.json()) as SslLabsResult;
    if (json.status === "READY" || json.status === "ERROR") return json;
  }
  throw new Error("انتهت مهلة الفحص (3 دقائق) — حاول لاحقاً");
}

export const adminRunDomainScan = createServerFn({ method: "POST" })
  .inputValidator((d) => RunScanInput.parse(d))
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: dom, error: dErr } = await supabaseAdmin
      .from("monitored_domains")
      .select("id, domain")
      .eq("id", data.id)
      .single();
    if (dErr || !dom) throw new Error("الدومين غير موجود");

    const { data: scanRow, error: insErr } = await supabaseAdmin
      .from("domain_scans")
      .insert({ domain_id: dom.id, domain: dom.domain, source: "ssllabs", status: "running" })
      .select("id")
      .single();
    if (insErr || !scanRow) throw new Error(insErr?.message || "تعذّر إنشاء سجل الفحص");

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 3 * 60 * 1000 + 5000);

    try {
      const result = await pollSslLabs(dom.domain, ac.signal);
      clearTimeout(t);

      const ep = result.endpoints?.[0];
      const cert = ep?.details?.cert;
      const protocols = ep?.details?.protocols?.map((p) => `${p.name} ${p.version}`) ?? [];

      const update = {
        status: result.status === "READY" ? "ready" : "error",
        grade: ep?.grade ?? null,
        has_warnings: ep?.hasWarnings ?? null,
        cert_subject: cert?.subject ?? null,
        cert_issuer: cert?.issuerSubject ?? null,
        cert_valid_from: cert?.notBefore ? new Date(cert.notBefore).toISOString() : null,
        cert_valid_to: cert?.notAfter ? new Date(cert.notAfter).toISOString() : null,
        protocols: protocols.length ? protocols : null,
        endpoints: result.endpoints ? JSON.parse(JSON.stringify(result.endpoints)) : null,
        raw_result: JSON.parse(JSON.stringify(result)),
        error: result.status === "ERROR" ? result.statusMessage ?? "Unknown error" : null,
        completed_at: new Date().toISOString(),
      };

      await supabaseAdmin.from("domain_scans").update(update).eq("id", scanRow.id);
      return { id: scanRow.id, status: update.status, grade: update.grade };
    } catch (e) {
      clearTimeout(t);
      const msg = e instanceof Error ? e.message : "خطأ غير معروف";
      await supabaseAdmin
        .from("domain_scans")
        .update({ status: "error", error: msg, completed_at: new Date().toISOString() })
        .eq("id", scanRow.id);
      throw new Error(msg);
    }
  });
