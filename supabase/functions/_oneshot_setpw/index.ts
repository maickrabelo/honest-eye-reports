import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { secret, email, password } = await req.json();
  if (secret !== "oneshot-karen-2026") return new Response("nope", { status: 403, headers: cors });
  let target: any = null;
  for (let page = 1; page < 50; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    target = data.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (target || data.users.length < 1000) break;
  }
  if (!target) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: cors });
  const { error } = await admin.auth.admin.updateUserById(target.id, { password, email_confirm: true });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
  await admin.from("profiles").update({ must_change_password: false, password_reset_reason: null }).eq("id", target.id);
  return new Response(JSON.stringify({ ok: true, user_id: target.id }), { headers: { ...cors, "Content-Type": "application/json" } });
});
