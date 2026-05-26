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

  let created = false;
  if (!target) {
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
    target = data.user;
    created = true;
  } else {
    const { error } = await admin.auth.admin.updateUserById(target.id, { password, email_confirm: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
  }

  // Get all Di-Santinni companies (by email)
  const { data: companies } = await admin.from("companies").select("id").eq("email", email);
  const companyIds = (companies ?? []).map((c: any) => c.id);

  // Ensure profile
  await admin.from("profiles").upsert({
    id: target.id,
    full_name: "Karen Rodrigues",
    company_id: companyIds[0] ?? null,
    must_change_password: false,
    password_reset_reason: null,
  });

  // Ensure 'company' role
  await admin.from("user_roles").upsert({ user_id: target.id, role: "company" }, { onConflict: "user_id,role" });

  // Link all companies via user_companies
  if (companyIds.length) {
    const rows = companyIds.map((cid: string) => ({ user_id: target.id, company_id: cid }));
    await admin.from("user_companies").upsert(rows, { onConflict: "user_id,company_id" });
  }

  return new Response(JSON.stringify({ ok: true, user_id: target.id, created, companies_linked: companyIds.length }), { headers: { ...cors, "Content-Type": "application/json" } });
});
