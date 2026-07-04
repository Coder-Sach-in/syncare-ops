import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ~5 MB base64 cap (base64 is ~1.37x raw bytes)
const MAX_AUDIO_BASE64_LEN = 7_000_000;

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { audioBase64?: string; mimeType?: string };
    if (!d?.audioBase64 || typeof d.audioBase64 !== "string") throw new Error("audioBase64 required");
    if (d.audioBase64.length > MAX_AUDIO_BASE64_LEN) throw new Error("audio payload too large");
    return { audioBase64: d.audioBase64, mimeType: d.mimeType || "audio/webm" };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Decode base64 → bytes
    const bin = atob(data.audioBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const mime = data.mimeType.split(";")[0];
    const ext =
      mime === "audio/webm" ? "webm" :
      mime === "audio/mp4" ? "mp4" :
      mime === "audio/mpeg" ? "mp3" :
      mime === "audio/wav" || mime === "audio/wave" ? "wav" :
      mime === "audio/ogg" ? "ogg" : "webm";

    const form = new FormData();
    form.append("file", new Blob([bytes], { type: mime }), `recording.${ext}`);
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("prompt", "Medicine stock update commands like 'paracetamol add 10' or 'crocin minus 5' in Hindi or English.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Transcription failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { text?: string };
    return { text: json.text ?? "" };
  });
