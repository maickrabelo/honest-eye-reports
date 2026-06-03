import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await caller.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claims.claims.sub as string;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const access_id = body.access_id ? String(body.access_id) : null;
    const user_id = body.user_id ? String(body.user_id) : null;
    const company_id = body.company_id ? String(body.company_id) : null;

    if (!access_id && !(user_id && company_id)) {
      return new Response(JSON.stringify({ error: "Informe access_id ou user_id + company_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar sst do caller
    const { data: prof } = await admin.from("profiles").select("sst_manager_id").eq("id", callerId).maybeSingle();
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    let query = admin.from("sector_viewer_access").delete();
    if (access_id) {
      query = query.eq("id", access_id);
    } else {
      query = query.eq("user_id", user_id!).eq("company_id", company_id!);
    }
    if (!isAdmin) {
      if (!prof?.sst_manager_id) {
        return new Response(JSON.stringify({ error: "Sem permissão." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.eq("sst_manager_id", prof.sst_manager_id);
    }
    const { error } = await query;
    if (error) {
      console.error("delete error", error);
      return new Response(JSON.stringify({ error: "Erro ao revogar." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
