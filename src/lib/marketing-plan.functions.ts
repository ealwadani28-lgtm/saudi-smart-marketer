import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { StoreSnapshot, StoreReport } from "./analyzer.functions";

const GenerateInput = z.object({
  userId: z.string().uuid(),
  analysisId: z.string().uuid().optional(),
  extra: z
    .object({
      monthlyBudget: z.number().optional(),
      primaryGoal: z.string().optional(),
      notes: z.string().max(500).optional(),
    })
    .optional(),
});

const ListInput = z.object({ userId: z.string().uuid() });

export type MarketingPlan = {
  summary: string;
  goals: Array<{ title: string; metric: string; target: string; timeframe: string }>;
  audience: {
    primaryPersona: { name: string; age: string; city: string; interests: string[]; painPoints: string[]; triggers: string[] };
    secondaryPersona?: { name: string; age: string; city: string; interests: string[]; painPoints: string[]; triggers: string[] };
  };
  channels: Array<{
    name: string;
    why: string;
    monthlyBudgetSar: number;
    tactics: string[];
  }>;
  contentCalendar: Array<{
    week: number;
    day: number;
    platform: string;
    format: string;
    hook: string;
    cta: string;
  }>;
  adCampaigns: Array<{
    platform: string;
    objective: string;
    audience: string;
    creativeAngle: string;
    adCopy: string;
    budgetSar: number;
    expectedKpi: string;
  }>;
  kpis: Array<{ name: string; target: string; frequency: string }>;
  budgetBreakdown: {
    totalSar: number;
    items: Array<{ label: string; amountSar: number; percent: number }>;
  };
  quickWins: string[];
};

const SYSTEM_PROMPT = `أنت خبير تسويق رقمي متخصص في السوق السعودي ومتاجر سلة وزد.
مهمتك: توليد خطة تسويق متكاملة بالعربية الفصحى الواضحة (مع لمسة سعودية في الأمثلة) بناءً على تحليل المتجر.

التزامات صارمة:
- لا تخترع بيانات لم ترد في snapshot. استخدم ما هو متاح فقط.
- كل توصية يجب أن تكون قابلة للتنفيذ خلال 30 يوم وميزانية واقعية بالريال السعودي.
- ركّز على المنصات الأكثر فاعلية للسوق السعودي: TikTok, Snapchat, Instagram, X (Twitter), Google Ads, WhatsApp Business.
- استخدم أوقات النشر السعودية (المساء بعد العشاء، الجمعة قبل صلاة الجمعة... إلخ).
- اربط الأفكار بأحداث السوق السعودي حين تناسب (موسم الرياض، اليوم الوطني، رمضان، عودة المدارس... إلخ) لكن لا تجبرها.

أعِد JSON فقط بالشكل التالي:
{
  "summary": "ملخص الخطة في 3-4 جمل",
  "goals": [{"title":"...","metric":"مثلاً عدد الطلبات","target":"100 طلب","timeframe":"30 يوم"}],
  "audience": {
    "primaryPersona": {"name":"...","age":"25-34","city":"الرياض/جدة","interests":["..."],"painPoints":["..."],"triggers":["..."]},
    "secondaryPersona": {...}
  },
  "channels": [{"name":"TikTok","why":"...","monthlyBudgetSar":1500,"tactics":["..."]}],
  "contentCalendar": [{"week":1,"day":1,"platform":"TikTok","format":"reel","hook":"...","cta":"..."}],
  "adCampaigns": [{"platform":"Snapchat","objective":"conversions","audience":"...","creativeAngle":"...","adCopy":"...","budgetSar":1000,"expectedKpi":"ROAS 3x"}],
  "kpis": [{"name":"CTR","target":"1.5%","frequency":"أسبوعي"}],
  "budgetBreakdown": {"totalSar":5000,"items":[{"label":"إعلانات سناب","amountSar":2000,"percent":40}]},
  "quickWins": ["...","..."]
}

ضع 3-5 أهداف، 3-4 قنوات، تقويم محتوى 30 يوم (30 عنصر)، 4-6 حملات إعلانية، 5-7 KPIs، 5-8 quickWins.`;

export const generateMarketingPlan = createServerFn({ method: "POST" })
  .inputValidator((d) => GenerateInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: customer, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id, status")
      .eq("user_id", data.userId)
      .single();
    if (cErr || !customer) throw new Error("لم نجد مساحة عملك");
    if (customer.status !== "active") throw new Error("اشتراكك غير مفعّل");

    // Get latest analysis (or specified one)
    let analysisQuery = supabaseAdmin
      .from("store_analyses")
      .select("id, store_url, snapshot, report")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data.analysisId) {
      analysisQuery = supabaseAdmin
        .from("store_analyses")
        .select("id, store_url, snapshot, report")
        .eq("customer_id", customer.id)
        .eq("id", data.analysisId)
        .limit(1);
    }
    const { data: analyses, error: aErr } = await analysisQuery;
    if (aErr || !analyses || analyses.length === 0) {
      throw new Error("لا يوجد تحليل لمتجرك بعد — شغّل تحليل المتجر أولاً");
    }
    const analysis = analyses[0];
    const snapshot = analysis.snapshot as StoreSnapshot;
    const report = analysis.report as StoreReport;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY غير مهيأ");

    const userMsg = `بيانات المتجر:
${JSON.stringify(
  {
    url: snapshot.url,
    title: snapshot.title,
    description: snapshot.description,
    platform: snapshot.signals.platform,
    products: snapshot.products.slice(0, 12),
    socialLinks: snapshot.socialLinks,
    signals: snapshot.signals,
  },
  null,
  2,
)}

تحليل سابق:
${JSON.stringify({
  summary: report.summary,
  strengths: report.strengths,
  weaknesses: report.weaknesses,
  opportunities: report.opportunities,
}, null, 2)}

${data.extra?.monthlyBudget ? `ميزانية شهرية مقترحة: ${data.extra.monthlyBudget} ريال` : "افترض ميزانية شهرية مناسبة لمتجر صغير-متوسط بين 3000 و 8000 ريال."}
${data.extra?.primaryGoal ? `الهدف الرئيسي للعميل: ${data.extra.primaryGoal}` : ""}
${data.extra?.notes ? `ملاحظات إضافية: ${data.extra.notes}` : ""}

أعِد خطة تسويق متكاملة بصيغة JSON كما طُلب.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[marketing-plan] upstream error", res.status, txt.slice(0, 500));
      if (res.status === 429) throw new Error("الخدمة مشغولة، أعد المحاولة بعد دقيقة");
      if (res.status === 402) throw new Error("الخدمة مشغولة حالياً، تواصل معنا");
      throw new Error("تعذّر توليد الخطة الآن");
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let plan: MarketingPlan;
    try {
      plan = JSON.parse(content);
    } catch {
      throw new Error("رد الذكاء غير صالح، أعد المحاولة");
    }
    if (!plan.summary || !Array.isArray(plan.goals) || !Array.isArray(plan.channels)) {
      throw new Error("الخطة ناقصة، أعد المحاولة");
    }

    const { data: row, error } = await supabaseAdmin
      .from("marketing_plans")
      .insert({
        customer_id: customer.id,
        analysis_id: analysis.id,
        store_url: analysis.store_url,
        plan,
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(`فشل حفظ الخطة: ${error.message}`);

    await supabaseAdmin.from("customer_updates").insert({
      customer_id: customer.id,
      type: "plan",
      title: `خطة التسويق المتكاملة جاهزة`,
      body: plan.summary,
      done: true,
    });

    return { id: row?.id, plan, createdAt: row?.created_at, storeUrl: analysis.store_url };
  });

export const listMarketingPlans = createServerFn({ method: "POST" })
  .inputValidator((d) => ListInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", data.userId)
      .single();
    if (!customer) return { plans: [] };
    const { data: rows } = await supabaseAdmin
      .from("marketing_plans")
      .select("id, store_url, plan, created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(10);
    return { plans: rows ?? [] };
  });
