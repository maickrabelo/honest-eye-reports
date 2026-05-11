import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud.user) return new Response(JSON.stringify({ error: "invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(url, service);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: ud.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { email, password, must_change_password } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: "email and password required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // find user
    let target: any = null;
    let page = 1;
    while (page < 50) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      target = data.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
      if (target || data.users.length < 1000) break;
      page++;
    }
    if (!target) return new Response(JSON.stringify({ error: "user not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { error: updErr } = await admin.auth.admin.updateUserById(target.id, { password });
    if (updErr) throw updErr;

    if (must_change_password) {
      await admin.from("profiles").update({ must_change_password: true, password_reset_reason: "admin_reset" }).eq("id", target.id);
    }

    return new Response(JSON.stringify({ success: true, user_id: target.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
