import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Generate a random temporary password
function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out + "!" + Math.floor(Math.random() * 90 + 10);
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "district_admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden: district admin only");
}

// Reset a center staff user's password (returns new temp password)
export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const newPassword = tempPassword();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, { password: newPassword });
    if (error) throw new Error(error.message);
    return { newPassword };
  });

// Create a new center + linked staff account
export const adminCreateCenter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { centerName: string; centerType: "PHC" | "CHC"; email: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: center, error: cErr } = await supabaseAdmin
      .from("centers")
      .insert({ center_name: data.centerName, center_type: data.centerType, district: "Ujjain" })
      .select()
      .single();
    if (cErr) throw new Error(cErr.message);

    const password = tempPassword();
    const { data: user, error: uErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: `${data.centerName} Staff` },
    });
    if (uErr) {
      // rollback center
      await supabaseAdmin.from("centers").delete().eq("id", center.id);
      throw new Error(uErr.message);
    }

    await supabaseAdmin.from("profiles").insert({ id: user.user!.id, center_id: center.id, full_name: `${data.centerName} Staff` });
    await supabaseAdmin.from("user_roles").insert({ user_id: user.user!.id, role: "center_staff" });

    return { center, email: data.email, password };
  });

// List all users with role + center + email (admin only)
export const adminListStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, center_id, full_name");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    return users.users.map((u) => {
      const p = profiles?.find((x) => x.id === u.id);
      const r = roles?.find((x) => x.user_id === u.id);
      return { id: u.id, email: u.email ?? "", full_name: p?.full_name ?? "", center_id: p?.center_id ?? null, role: r?.role ?? null };
    });
  });
