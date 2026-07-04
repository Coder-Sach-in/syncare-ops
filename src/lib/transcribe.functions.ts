import { createServerFn } from "@tanstack/react-start";

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { audioBase64?: string; mimeType?: string };
    if (!d?.audioBase64 || typeof d.audioBase64 !== "string") throw new Error("audioBase64 required");
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
    form.append("language", "en");
    form.append("prompt", "English medicine stock update commands like 'paracetamol add 10' or 'crocin minus 5'.");

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
