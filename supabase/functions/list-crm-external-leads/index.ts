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

    // Identify SMS plan IDs (trial accounts on SMS plans must NOT appear in CRM)
    const { data: smsPlans } = await admin
      .from("subscription_plans")
      .select("id")
      .ilike("slug", "%sms%");
    const smsPlanIds = new Set((smsPlans || []).map((p: any) => p.id));

    // Subscriptions on SMS plans → collect owner_user_ids to exclude SST managers
    const { data: smsSubs } = await admin
      .from("subscriptions")
      .select("id, owner_user_id, plan_id")
      .in("plan_id", Array.from(smsPlanIds));
    const smsSubIds = new Set((smsSubs || []).map((s: any) => s.id));
    const smsOwnerUserIds = new Set(
      (smsSubs || []).map((s: any) => s.owner_user_id).filter(Boolean),
    );

    // SST manager IDs to exclude (owners of SMS subscriptions, via profiles.sst_manager_id)
    let smsSstManagerIds = new Set<string>();
    if (smsOwnerUserIds.size > 0) {
      const { data: smsProfiles } = await admin
        .from("profiles")
        .select("id, sst_manager_id")
        .in("id", Array.from(smsOwnerUserIds));
      smsSstManagerIds = new Set(
        (smsProfiles || [])
          .map((p: any) => p.sst_manager_id)
          .filter(Boolean),
      );
    }

    // Trial companies (exclude those whose parent_subscription is an SMS plan)
    const { data: trialCompanies } = await admin
      .from("companies")
      .select("id, name, email, phone, address, trial_ends_at, created_at, parent_subscription_id")
      .not("trial_ends_at", "is", null);

    // Trial SST managers (exclude those owning SMS-plan subscriptions)
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
