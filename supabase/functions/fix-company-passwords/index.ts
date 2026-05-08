import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    let authorized = false;
    if (token && token === supabaseServiceKey) {
      authorized = true;
    } else if (token) {
      const caller = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: claims } = await caller.auth.getClaims(token);
      const callerId = claims?.claims?.sub;
      if (callerId) {
        const adminTmp = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roles } = await adminTmp.from("user_roles").select("role").eq("user_id", callerId);
        if (roles?.some((r: any) => r.role === "admin")) authorized = true;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const onlyNeverSignedIn: boolean = body.only_never_signed_in !== false;

    // Get all companies + linked users
    const { data: companies } = await admin
      .from("companies")
      .select("id, cnpj, email, name");

    const results: any[] = [];
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });

    for (const c of companies ?? []) {
      const cnpjDigits = String(c.cnpj ?? "").replace(/\D/g, "");
      if (cnpjDigits.length < 8) {
        results.push({ company: c.name, status: "skipped_invalid_cnpj" });
        continue;
      }
      const email = String(c.email ?? "").trim().toLowerCase();
      const u = users.find((x: any) => x.email?.toLowerCase() === email);
      if (!u) {
        results.push({ company: c.name, email, status: "no_auth_user" });
        continue;
      }
      if (onlyNeverSignedIn && u.last_sign_in_at) {
        results.push({ company: c.name, email, status: "skipped_already_signed_in" });
        continue;
      }
      const { error: updErr } = await admin.auth.admin.updateUserById(u.id, {
        password: cnpjDigits,
      });
      if (updErr) {
        results.push({ company: c.name, email, status: "error", error: updErr.message });
      } else {
        await admin.from("profiles").update({ must_change_password: true }).eq("id", u.id);
        results.push({ company: c.name, email, status: "reset_ok" });
      }
    }

    return new Response(JSON.stringify({ success: true, total: results.length, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
