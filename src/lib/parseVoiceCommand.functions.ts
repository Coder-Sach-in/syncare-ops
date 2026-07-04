import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_TRANSCRIPT_LEN = 1000;
const MAX_MEDICINES = 500;
const MAX_MEDICINE_NAME_LEN = 200;

export const parseVoiceCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { transcript?: string; medicines?: string[] };
    if (!d?.transcript || typeof d.transcript !== "string") throw new Error("transcript required");
    if (d.transcript.length > MAX_TRANSCRIPT_LEN) throw new Error("transcript too long");
    if (!Array.isArray(d.medicines)) throw new Error("medicines required");
    if (d.medicines.length > MAX_MEDICINES) throw new Error("too many medicines");
    const medicines = d.medicines.map((m) => String(m).slice(0, MAX_MEDICINE_NAME_LEN));
    return { transcript: d.transcript, medicines };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `You interpret bilingual (Hindi + English, including Devanagari and Hinglish) medicine stock update commands.
You are given a transcript and a list of medicine names. Return strict JSON:
{"medicine": <exact-name-from-list-or-null>, "action": "add"|"subtract"|null, "quantity": <positive-integer-or-null>}

Rules:
- Match the medicine name in the transcript against the given list. Match by pronunciation, transliteration, or partial name. If nothing plausibly matches, medicine=null.
- action: "add" for add/plus/badhao/जोड़ो/बढ़ाओ/और/इंक्रीज़; "subtract" for minus/subtract/remove/kam karo/घटाओ/कम/निकालो/माइनस.
- quantity: any Hindi or English number word or digit (do/दो=2, teen/तीन=3, panch/paanch/पांच=5, das/दस=10 etc). Null if none.
- Return ONLY the JSON object, no prose.`;

    const user = `Medicine list: ${JSON.stringify(data.medicines)}\nTranscript: ${data.transcript}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Parse failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { medicine?: string | null; action?: "add" | "subtract" | null; quantity?: number | null } = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    return {
      medicine: parsed.medicine ?? null,
      action: (parsed.action === "add" || parsed.action === "subtract") ? parsed.action : null,
      quantity: typeof parsed.quantity === "number" && parsed.quantity > 0 ? Math.floor(parsed.quantity) : null,
    };
  });
