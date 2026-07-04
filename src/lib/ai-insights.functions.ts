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
  item_name: string | null;
  suggested_quantity: number | null;
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
  - center_ref: the short "ref" code of the primary related center (e.g. "C1"), or null. For "redistribution" this MUST be the DESTINATION center — the one that is SHORT of the medicine and would receive the transfer. Use the ref codes exactly as provided in the "centers" list — DO NOT invent UUIDs and DO NOT put any UUID or ref code inside the title or description text.
  - related_center_ref: the ref code of the second center. For "redistribution" this MUST be the SOURCE center — the one holding the surplus of the same medicine. Null for other categories.
  - title: short headline (< 70 chars). Use the plain center NAME (e.g. "Ghatia CHC"), never a code or UUID.
  - description: 1-3 sentences in simple, plain English explaining WHAT is happening and WHY, referencing concrete numbers from the data. Use the plain center NAME only — never a ref code, never a UUID. Avoid jargon.
  - severity: "high" | "medium" | "low"
  - item_name: For "redistribution" and "expiry" insights, the exact medicine name from the stock data (string). Null for other categories.
  - suggested_quantity: For "redistribution" insights, an integer count of units recommended to transfer from source to destination (a sensible amount the source can spare and the destination needs). Null for other categories.

Cover these categories when the data supports them (skip a category rather than invent):
  a) stockout   — medicines at real risk of running out soon based on current low stock and demand signals. Explain reasoning.
  b) redistribution — one center is short of a medicine while another has surplus of the SAME medicine. Recommend a specific transfer with an item_name and suggested_quantity. center_ref = destination (short), related_center_ref = source (surplus).
  c) expiry     — for EVERY stock row whose "expiry_date" is within the next 30 days from today (see "today" in the payload), generate ONE "expiry" insight. Severity: "high" if expiry_date is within 7 days OR expiry_date is already in the past; "medium" if within 30 days. Description MUST state the medicine name, the current stock quantity, the exact expiry date, and how many days remain (use negative wording like "expired X days ago" if already past). Recommend either using the stock soon at that center or transferring it to another center that shows active demand for the SAME medicine (low stock, a pending requisition for it, or higher throughput). If no stock row has an expiry_date within 30 days, skip this category entirely — do not invent expiry insights.
  d) footfall   — compare THIS WEEK's total patient footfall vs LAST WEEK's total per center using the "footfall_weekly" summary. Only generate a footfall insight for a center with data in BOTH weeks. If a center lacks 2 weeks of data, SKIP it — do not guess from proxies.

Return between 3 and 12 insights total. Be specific, not generic.`;

export const runAiAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI service is not configured");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Gather data
    const [centersRes, stockRes, attRes, bedsRes, testsRes, pathRes, reqsRes, footRes] = await Promise.all([
      supabaseAdmin.from("centers").select("id, center_name, center_type"),
      supabaseAdmin.from("stock").select("id, center_id, name, stock, expiry_date, created_at, updated_at"),
      supabaseAdmin.from("attendance").select("id, center_id, name, role, status, last_marked_at"),
      supabaseAdmin.from("beds").select("id, center_id, name, count, available"),
      supabaseAdmin.from("tests").select("id, center_id, name, available"),
      supabaseAdmin.from("pathology_labs").select("id, center_id, test_name, sample_status, report_status, turnaround_time_hours, created_at, updated_at"),
      supabaseAdmin.from("requisition_requests").select("id, center_id, item_name, item_type, quantity_requested, status, requested_at, resolved_at"),
      supabaseAdmin.from("patient_footfall").select("center_id, date, patient_count"),
    ]);

    // Build ref-code map so the model never sees raw UUIDs
    const centersRaw = centersRes.data ?? [];
    const centerByRef: Record<string, { id: string; name: string; type: string }> = {};
    const refByCenterId: Record<string, string> = {};
    const centersForModel = centersRaw.map((c: any, i: number) => {
      const ref = `C${i + 1}`;
      centerByRef[ref] = { id: c.id, name: `${c.center_name} ${c.center_type}`.trim(), type: c.center_type };
      refByCenterId[c.id] = ref;
      return { ref, name: `${c.center_name} ${c.center_type}`.trim(), type: c.center_type };
    });
    const withRef = <T extends { center_id: string | null }>(rows: T[]) =>
      rows.map(({ center_id, ...rest }) => ({ center: center_id ? refByCenterId[center_id] ?? null : null, ...rest }));

    // Aggregate footfall into this-week vs last-week totals per center
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const thisWeekStart = new Date(startOfToday.getTime() - 6 * 86400000);
    const lastWeekStart = new Date(startOfToday.getTime() - 13 * 86400000);
    const lastWeekEnd = new Date(startOfToday.getTime() - 7 * 86400000);
    const footfallWeekly: Record<string, { center: string; center_name: string; this_week_total: number; last_week_total: number; days_this_week: number; days_last_week: number }> = {};
    for (const c of centersRaw as any[]) {
      const ref = refByCenterId[c.id];
      footfallWeekly[ref] = { center: ref, center_name: `${c.center_name} ${c.center_type}`.trim(), this_week_total: 0, last_week_total: 0, days_this_week: 0, days_last_week: 0 };
    }
    for (const row of (footRes.data ?? []) as any[]) {
      const ref = refByCenterId[row.center_id];
      if (!ref) continue;
      const d = new Date(row.date + "T00:00:00");
      if (d >= thisWeekStart && d <= startOfToday) {
        footfallWeekly[ref].this_week_total += row.patient_count;
        footfallWeekly[ref].days_this_week += 1;
      } else if (d >= lastWeekStart && d <= lastWeekEnd) {
        footfallWeekly[ref].last_week_total += row.patient_count;
        footfallWeekly[ref].days_last_week += 1;
      }
    }

    const payload = {
      generated_at: new Date().toISOString(),
      today: startOfToday.toISOString().slice(0, 10),
      notes:
        "Each stock row has an optional 'expiry_date' (ISO YYYY-MM-DD, may be null). Compare it to 'today' to compute days remaining and drive expiry insights per the rules above. Use ONLY the footfall_weekly summary for footfall insights (real patient counts). Skip footfall for any center that lacks data in both weeks.",
      centers: centersForModel,
      stock: withRef(stockRes.data ?? []),
      attendance: withRef(attRes.data ?? []),
      beds: withRef(bedsRes.data ?? []),
      tests: withRef(testsRes.data ?? []),
      pathology_labs: withRef(pathRes.data ?? []),
      requisition_requests: withRef(reqsRes.data ?? []),
      footfall_weekly: Object.values(footfallWeekly),
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

    let insights: any[] = [];
    try {
      const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) insights = parsed;
      else if (Array.isArray(parsed?.insights)) insights = parsed.insights;
      else if (Array.isArray(parsed?.data)) insights = parsed.data;
      else {
        for (const v of Object.values(parsed ?? {})) {
          if (Array.isArray(v)) { insights = v as any[]; break; }
        }
      }
    } catch (e) {
      throw new Error("AI returned malformed JSON");
    }

    // Strip any UUIDs that the model may have accidentally embedded in text
    const UUID_RE = /\s*[\(\[]?\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b[\)\]]?/gi;
    const stripUuid = (s: string) => s.replace(UUID_RE, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();

    const rowsToInsert = insights
      .filter((i) => i && typeof i === "object")
      .map((i) => {
        const insight_type = ["stockout", "redistribution", "expiry", "footfall"].includes(i.insight_type as string)
          ? (i.insight_type as InsightType)
          : "stockout";
        const severity = ["high", "medium", "low"].includes(i.severity as string) ? (i.severity as Severity) : "medium";
        const primaryRef = typeof i.center_ref === "string" ? i.center_ref : (typeof i.center_id === "string" ? i.center_id : null);
        const relatedRef = typeof i.related_center_ref === "string" ? i.related_center_ref : (typeof i.related_center_id === "string" ? i.related_center_id : null);
        const center_id = primaryRef && centerByRef[primaryRef] ? centerByRef[primaryRef].id : null;
        const related_center_id = relatedRef && centerByRef[relatedRef] ? centerByRef[relatedRef].id : null;
        return {
          insight_type,
          center_id,
          related_center_id,
          title: stripUuid(String(i.title ?? "Insight")).slice(0, 200),
          description: stripUuid(String(i.description ?? "")).slice(0, 2000),
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
