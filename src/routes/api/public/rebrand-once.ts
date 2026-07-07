import { createFileRoute } from "@tanstack/react-router";

const UPDATES: Array<{ id: string; email: string }> = [
  { id: "beb2a289-907f-4f48-a6d6-75d3d28e3994", email: "admin@smartsehat.ai" },
  { id: "63412191-0553-49a8-a5b6-3068515f0d0f", email: "charak@smartsehat.ai" },
  { id: "f5544fe4-602f-4fce-8e80-3e275d36f74c", email: "ghatia@smartsehat.ai" },
  { id: "2297eae6-17e6-4079-a56c-606926e1a6b8", email: "jharda@smartsehat.ai" },
  { id: "f502d689-19fc-423d-94c1-ab99cbda5040", email: "narwar@smartsehat.ai" },
  { id: "07979c76-c5d7-45d5-8c10-a33f52910b4b", email: "tarana@smartsehat.ai" },
  { id: "41bbdad1-1226-4204-9955-f47aa78200b0", email: "unhel@smartsehat.ai" },
];
const PASSWORD = "SmartSehat@2026";

export const Route = createFileRoute("/api/public/rebrand-once")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-rebrand-token") !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
          return new Response("forbidden", { status: 403 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const results: any[] = [];
        for (const u of UPDATES) {
          const { error } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
            email: u.email,
            password: PASSWORD,
            email_confirm: true,
          });
          results.push({ id: u.id, email: u.email, error: error?.message ?? null });
        }
        return new Response(JSON.stringify({ results }, null, 2), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
