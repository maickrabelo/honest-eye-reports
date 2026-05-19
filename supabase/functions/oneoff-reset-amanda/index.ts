import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const email = "amanda.muniz@ergogroup.com.br";
  const password = "21135906000193";
  let target: any = null;
  let page = 1;
  while (page < 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    target = data.users.find((u) => u.email?.toLowerCase() === email);
    if (target || data.users.length < 1000) break;
    page++;
  }
  if (!target) return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
  const { error: updErr } = await admin.auth.admin.updateUserById(target.id, { password });
  if (updErr) return new Response(JSON.stringify({ error: updErr.message }), { status: 500 });
  await admin.from("profiles").update({ must_change_password: true, password_reset_reason: "admin_reset" }).eq("id", target.id);
  return new Response(JSON.stringify({ success: true, user_id: target.id }), { headers: { "Content-Type": "application/json" } });
});
