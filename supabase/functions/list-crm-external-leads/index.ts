import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // verify user role
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: rolesRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (rolesRows || []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("sales")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trial companies
    const { data: trialCompanies } = await admin
      .from("companies")
      .select("id, name, email, phone, address, trial_ends_at, created_at")
      .not("trial_ends_at", "is", null);

    // Trial SST managers
    const { data: trialSST } = await admin
      .from("sst_managers")
      .select("id, name, email, phone, address, trial_ends_at, created_at")
      .not("trial_ends_at", "is", null);

    // Demo leads
    const { data: demoLeads } = await admin
      .from("demo_leads")
      .select("id, name, email, phone, company_name, employee_count, source, message, created_at");

    // Affiliate leads
    const { data: affLeads } = await admin
      .from("affiliate_leads")
      .select("id, name, phone, company_name, referral_code, created_at");

    const items: any[] = [];

    (trialCompanies || []).forEach((c: any) => {
      items.push({
        external_id: `company:${c.id}`,
        source: "trial_empresa",
        source_label: "Trial Empresa",
        company_name: c.name,
        contact_name: null,
        email: c.email,
        phone: c.phone,
        city: c.address,
        trial_ends_at: c.trial_ends_at,
        created_at: c.created_at,
      });
    });

    (trialSST || []).forEach((s: any) => {
      items.push({
        external_id: `sst:${s.id}`,
        source: "trial_gestora",
        source_label: "Trial Gestora SST",
        company_name: s.name,
        contact_name: null,
        email: s.email,
        phone: s.phone,
        city: s.address,
        trial_ends_at: s.trial_ends_at,
        created_at: s.created_at,
      });
    });

    (demoLeads || []).forEach((d: any) => {
      items.push({
        external_id: `demo:${d.id}`,
        source: "demo_form",
        source_label: d.source ? `Form: ${d.source}` : "Formulário Demo",
        company_name: d.company_name || d.name,
        contact_name: d.name,
        email: d.email,
        phone: d.phone,
        city: null,
        trial_ends_at: null,
        created_at: d.created_at,
        notes: d.message,
      });
    });

    (affLeads || []).forEach((a: any) => {
      items.push({
        external_id: `affiliate:${a.id}`,
        source: "affiliate",
        source_label: `Afiliado (${a.referral_code})`,
        company_name: a.company_name || a.name,
        contact_name: a.name,
        email: null,
        phone: a.phone,
        city: null,
        trial_ends_at: null,
        created_at: a.created_at,
      });
    });

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
