/**
 * Automated security tests — run with: bun run scripts/security-tests.ts
 * Verifies RLS, role mappings, and endpoint access controls against the live preview.
 *
 * Override target with: BASE_URL=https://your-domain bun run scripts/security-tests.ts
 */
import { createClient } from "@supabase/supabase-js";

const BASE_URL =
  process.env.BASE_URL ??
  "https://id-preview--fbca4300-86b5-4c34-86a8-68863dace247.lovable.app";

const SUPABASE_URL = "https://jfaaxxilugjwaxfkqmgg.supabase.co";
const ANON_KEY = "sb_publishable_a1S5VEFedPMJL6WRo_7xCA_FkXhVgAv";

const supa = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Result = { name: string; pass: boolean; detail: string };
const results: Result[] = [];
const expect = (name: string, pass: boolean, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

async function runRlsTests() {
  console.log("\n─── RLS: anon role ───");

  const sel = await supa.from("early_signups").select("*").limit(1);
  expect(
    "anon cannot SELECT early_signups",
    sel.error !== null || (sel.data?.length ?? 0) === 0,
    sel.error?.message ?? `got ${sel.data?.length ?? 0} rows`,
  );

  const upd = await supa.from("early_signups").update({ email: "x@x.x" }).neq("id", "00000000-0000-0000-0000-000000000000");
  expect("anon cannot UPDATE early_signups", upd.error !== null, upd.error?.message ?? "no error");

  const del = await supa.from("early_signups").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  expect("anon cannot DELETE early_signups", del.error !== null, del.error?.message ?? "no error");

  const ins = await supa.from("early_signups").insert({ email: `direct-${Date.now()}@test.com`, source: "rls_test" });
  expect("anon cannot directly INSERT early_signups (must go via server fn)", ins.error !== null, ins.error?.message ?? "no error");

  const rl = await supa.from("rate_limits").select("*").limit(1);
  expect("anon cannot SELECT rate_limits", rl.error !== null || (rl.data?.length ?? 0) === 0, rl.error?.message ?? "");

  const rlIns = await supa.from("rate_limits").insert({ key: "x", count: 1 });
  expect("anon cannot INSERT rate_limits", rlIns.error !== null, rlIns.error?.message ?? "no error");

  const rpc = await supa.rpc("rl_hit", { _key: "abuse", _limit: 1, _window_seconds: 60 });
  expect("anon cannot call rl_hit RPC", rpc.error !== null, rpc.error?.message ?? "no error");
}

async function runEndpointTests() {
  console.log("\n─── Endpoint access controls ───");

  // 1. /api/generate-image — foreign origin must be blocked
  const foreign = await fetch(`${BASE_URL}/api/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://evil.example.com" },
    body: JSON.stringify({ product: "test", tone: "fun" }),
  });
  expect("generate-image rejects foreign origin (403)", foreign.status === 403, `status=${foreign.status}`);

  // 2. /api/generate-image — invalid body returns 400 (with allowed origin)
  const allowedOrigin = new URL(BASE_URL).origin;
  const badBody = await fetch(`${BASE_URL}/api/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: allowedOrigin },
    body: JSON.stringify({ bogus: true }),
  });
  expect("generate-image rejects invalid body (400)", badBody.status === 400, `status=${badBody.status}`);

  // 3. /api/generate-image — has noindex header
  expect("generate-image sets X-Robots-Tag: noindex", foreign.headers.get("x-robots-tag")?.includes("noindex") === true);

  // 4. adminListSignups — no token
  const adminNoToken = await callServerFn("/_serverFn/src_lib_admin_functions_ts--adminListSignups_createServerFn_handler", {});
  expect("adminListSignups rejects missing token", adminNoToken.status >= 400, `status=${adminNoToken.status}`);

  // 5. adminListSignups — invalid token
  const adminBadToken = await callServerFn("/_serverFn/src_lib_admin_functions_ts--adminListSignups_createServerFn_handler", {
    token: "definitely-not-a-valid-token",
  });
  expect("adminListSignups rejects invalid token", adminBadToken.status >= 400, `status=${adminBadToken.status}`);

  // 6. adminLogin — wrong password
  const wrongPw = await callServerFn("/_serverFn/src_lib_admin_functions_ts--adminLogin_createServerFn_handler", {
    password: "wrong-password-attempt",
  });
  expect("adminLogin rejects wrong password", wrongPw.status >= 400, `status=${wrongPw.status}`);
}

// TanStack server fn calls use POST with JSON body wrapping
async function callServerFn(path: string, payload: any) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: payload }),
    });
    return { status: res.status, text: await res.text().catch(() => "") };
  } catch (e: any) {
    return { status: 0, text: e?.message ?? "fetch error" };
  }
}

(async () => {
  console.log(`🔒 Security audit against: ${BASE_URL}\n`);
  await runRlsTests();
  await runEndpointTests();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n─── Summary: ${results.length - failed.length}/${results.length} passed ───`);
  if (failed.length > 0) {
    console.log("Failures:");
    failed.forEach((f) => console.log(`  ❌ ${f.name} — ${f.detail}`));
    process.exit(1);
  }
  console.log("✅ All security checks passed");
})();
