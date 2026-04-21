import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) =>
  console.log(`[ADD-COMPANY-TRIAL] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticated client (validates JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const supabase = createClient(supabaseUrl, serviceKey);

    const { company_name, cnpj, phone, address } = await req.json();
    if (!company_name || !cnpj) {
      return new Response(JSON.stringify({ error: "Nome e CNPJ obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cnpjDigits = String(cnpj).replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      return new Response(JSON.stringify({ error: "CNPJ inválido (14 dígitos)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate caller is a company role user
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r: any) => r.role === "company")) {
      return new Response(JSON.stringify({ error: "Apenas contas empresa podem adicionar CNPJs." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller's primary company to inherit trial info
    const { data: profile } = await supabase
      .from("profiles").select("company_id").eq("id", userId).single();
    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "Empresa principal não encontrada." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: parentCompany } = await supabase
      .from("companies")
      .select("trial_plan_slug, subscription_status, trial_ends_at, parent_subscription_id, email")
      .eq("id", profile.company_id).single();

    if (parentCompany?.trial_plan_slug !== "corporate") {
      return new Response(JSON.stringify({ error: "Apenas planos Corporate permitem múltiplos CNPJs." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Slug
    const baseSlug = String(company_name)
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: slugExists } = await supabase
      .from("companies").select("id").eq("slug", baseSlug).maybeSingle();
    const slug = slugExists ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    // Create company (inherits parent's trial / plan)
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert({
        name: company_name,
        cnpj: cnpjDigits,
        email: parentCompany.email,
        phone: phone ?? null,
        address: address ?? null,
        slug,
        subscription_status: parentCompany.subscription_status ?? "trial",
        trial_ends_at: parentCompany.trial_ends_at,
        trial_plan_slug: "corporate",
        parent_subscription_id: parentCompany.parent_subscription_id ?? null,
      })
      .select()
      .single();
    if (companyErr) throw new Error(`Erro ao criar empresa: ${companyErr.message}`);
    log("company created", { id: company.id });

    // Link to user
    await supabase.from("user_companies").insert({
      user_id: userId,
      company_id: company.id,
      is_default: false,
    });

    // Enable all features
    await supabase.from("company_feature_access").upsert({
      company_id: company.id,
      ouvidoria_enabled: true,
      psicossocial_enabled: true,
      burnout_enabled: true,
      clima_enabled: true,
      treinamentos_enabled: true,
    });

    return new Response(JSON.stringify({ success: true, company_id: company.id, slug }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    log("ERROR", error?.message);
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
