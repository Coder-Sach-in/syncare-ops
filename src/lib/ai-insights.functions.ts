import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type InsightType = "stockout" | "redistribution" | "expiry" | "footfall";
type Severity = "high" | "medium" | "low";

type AiInsight = {
  insight_type: InsightType;
  center_id: string | null;
  related_center_id: string | null;
  title: string;
  description: string;
  severity: Severity;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "district_admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: district admin only");
}

const SYSTEM_PROMPT = `You are a public-health operations analyst helping a district health officer in Ujjain, India oversee a small network of Primary Health Centers (PHC) and Community Health Centers (CHC). Your job: read the raw operational data below and produce concise, plain-language insights a non-technical PHC nurse or district officer can act on immediately.

Return STRICT JSON only. No markdown fences, no preamble, no trailing text. The response MUST be a JSON array of insight objects with EXACTLY these keys:
  - insight_type: one of "stockout" | "redistribution" | "expiry" | "footfall"
  - center_id: UUID string of the primary related center, or null (use null for redistribution insights that span two centers if you cannot pick one primary; otherwise set it to the shortage center)
  - related_center_id: UUID string of the second/destination center (only for redistribution), else null
  - title: short headline (< 70 chars)
  - description: 1-3 sentences in simple, plain English explaining WHAT is happening and WHY, referencing concrete numbers from the data. Avoid jargon.
  - severity: "high" | "medium" | "low"

Cover these categories when the data supports them (skip a category rather than invent):
  a) stockout   — medicines at real risk of running out soon based on current low stock and demand signals. Explain reasoning.
  b) redistribution — one center is short of a medicine while another has surplus of the SAME medicine. Recommend a specific transfer.
  c) expiry     — medicines nearing expiry that should be used or moved. If no expiry data is provided, skip this category.
  d) footfall   — a one-line comparison per center of this week vs last week's patient footfall trend, in plain language. If no footfall data, skip.

Return between 3 and 12 insights total. Be specific, not generic.`;

export const runAiAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI service is not configured");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Gather data
    const [centersRes, stockRes, attRes, bedsRes, testsRes, pathRes, reqsRes] = await Promise.all([
      supabaseAdmin.from("centers").select("id, center_name, center_type"),
      supabaseAdmin.from("stock").select("id, center_id, name, stock, created_at, updated_at"),
      supabaseAdmin.from("attendance").select("id, center_id, name, role, status, last_marked_at"),
      supabaseAdmin.from("beds").select("id, center_id, name, count, available"),
      supabaseAdmin.from("tests").select("id, center_id, name, available"),
      supabaseAdmin.from("pathology_labs").select("id, center_id, test_name, sample_status, report_status, turnaround_time_hours, created_at, updated_at"),
      supabaseAdmin.from("requisition_requests").select("id, center_id, item_name, item_type, quantity_requested, status, requested_at, resolved_at"),
    ]);

    const payload = {
      generated_at: new Date().toISOString(),
      notes:
        "No explicit medicine expiry column exists in the stock table — infer only if strong signal, otherwise skip expiry insights. No dedicated patient-footfall table exists; use pathology_labs volume and requisition_requests activity per center as a rough proxy for weekly patient throughput.",
      centers: centersRes.data ?? [],
      stock: stockRes.data ?? [],
      attendance: attRes.data ?? [],
      beds: bedsRes.data ?? [],
      tests: testsRes.data ?? [],
      pathology_labs: pathRes.data ?? [],
      requisition_requests: reqsRes.data ?? [],
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze the following data and return the JSON array of insights:\n\n${JSON.stringify(payload)}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => "");
      throw new Error(`AI gateway error ${aiRes.status}: ${text.slice(0, 300)}`);
    }

    const aiJson = await aiRes.json();
    const raw: string = aiJson?.choices?.[0]?.message?.content ?? "";

    // Extract JSON array from response (models sometimes wrap in { "insights": [...] })
    let insights: AiInsight[] = [];
    try {
      const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) insights = parsed;
      else if (Array.isArray(parsed?.insights)) insights = parsed.insights;
      else if (Array.isArray(parsed?.data)) insights = parsed.data;
      else {
        // find first array value in object
        for (const v of Object.values(parsed ?? {})) {
          if (Array.isArray(v)) { insights = v as AiInsight[]; break; }
        }
      }
    } catch (e) {
      throw new Error("AI returned malformed JSON");
    }

    const validCenterIds = new Set((centersRes.data ?? []).map((c: any) => c.id));
    const rowsToInsert = insights
      .filter((i) => i && typeof i === "object")
      .map((i) => {
        const insight_type = ["stockout", "redistribution", "expiry", "footfall"].includes(i.insight_type as string)
          ? (i.insight_type as InsightType)
          : "stockout";
        const severity = ["high", "medium", "low"].includes(i.severity as string) ? (i.severity as Severity) : "medium";
        return {
          insight_type,
          center_id: i.center_id && validCenterIds.has(i.center_id) ? i.center_id : null,
          related_center_id: i.related_center_id && validCenterIds.has(i.related_center_id) ? i.related_center_id : null,
          title: String(i.title ?? "Insight").slice(0, 200),
          description: String(i.description ?? "").slice(0, 2000),
          severity,
        };
      })
      .filter((r) => r.description.length > 0)
      .slice(0, 20);

    // Replace previous run
    await supabaseAdmin.from("ai_insights").delete().gt("generated_at", "1970-01-01");

    if (rowsToInsert.length > 0) {
      const { error: insErr } = await supabaseAdmin.from("ai_insights").insert(rowsToInsert);
      if (insErr) throw new Error(insErr.message);
    }

    return { count: rowsToInsert.length, generated_at: new Date().toISOString() };
  });

export const listAiInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("ai_insights")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
