import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchCompanyContext(supabase: any, companyId: string): Promise<string> {
  let ctx = "";

  const { data: company } = await supabase
    .from("companies")
    .select("name, cnpj, max_employees")
    .eq("id", companyId)
    .single();

  if (company) {
    ctx += `\n### ${company.name}`;
    if (company.cnpj) ctx += ` (CNPJ: ${company.cnpj})`;
    if (company.max_employees) ctx += ` | Máx. funcionários: ${company.max_employees}`;
  }

  // Reports
  const { count: totalReports } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const { count: pendingReports } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "pending");

  ctx += `\nDenúncias: ${totalReports || 0} total, ${pendingReports || 0} pendentes`;

  // HSE-IT
  const { data: hseitAssessments } = await supabase
    .from("hseit_assessments")
    .select("id, title, is_active")
    .eq("company_id", companyId);

  if (hseitAssessments?.length > 0) {
    ctx += `\nAvaliações HSE-IT:`;
    for (const a of hseitAssessments) {
      const { count } = await supabase
        .from("hseit_responses")
        .select("*", { count: "exact", head: true })
        .eq("assessment_id", a.id);
      ctx += ` ${a.title} (${count || 0} respostas, ${a.is_active ? "ativa" : "inativa"});`;
    }
  }

  // COPSOQ
  const { data: copsoqAssessments } = await supabase
    .from("copsoq_assessments")
    .select("id, title, is_active")
    .eq("company_id", companyId);

  if (copsoqAssessments?.length > 0) {
    ctx += `\nAvaliações COPSOQ II:`;
    for (const a of copsoqAssessments) {
      const { count } = await supabase
        .from("copsoq_responses")
        .select("*", { count: "exact", head: true })
        .eq("assessment_id", a.id);
      ctx += ` ${a.title} (${count || 0} respostas, ${a.is_active ? "ativa" : "inativa"});`;
    }
  }

  // Burnout
  const { data: burnoutAssessments } = await supabase
    .from("burnout_assessments")
    .select("id, title, is_active")
    .eq("company_id", companyId);

  if (burnoutAssessments?.length > 0) {
    ctx += `\nAvaliações Burnout:`;
    for (const a of burnoutAssessments) {
      const { count } = await supabase
        .from("burnout_responses")
        .select("*", { count: "exact", head: true })
        .eq("assessment_id", a.id);
      ctx += ` ${a.title} (${count || 0} respostas, ${a.is_active ? "ativa" : "inativa"});`;
    }
  }

  // Climate surveys
  const { data: climateSurveys } = await supabase
    .from("climate_surveys")
    .select("id, title, is_active")
    .eq("company_id", companyId);

  if (climateSurveys?.length > 0) {
    ctx += `\nPesquisas de Clima:`;
    for (const s of climateSurveys) {
      const { count } = await supabase
        .from("survey_responses")
        .select("*", { count: "exact", head: true })
        .eq("survey_id", s.id);
      ctx += ` ${s.title} (${count || 0} respostas, ${s.is_active ? "ativa" : "inativa"});`;
    }
  }

  return ctx;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, company_id, sst_manager_id, context_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let contextData = "";

    if (sst_manager_id) {
      // SST mode: fetch SST manager info and ALL assigned companies
      const { data: sstManager } = await supabase
        .from("sst_managers")
        .select("name, max_companies, slug, trial_ends_at, subscription_status")
        .eq("id", sst_manager_id)
        .single();

      if (sstManager) {
        contextData += `\n## Gestora SST: ${sstManager.name}`;
        contextData += `\nMáximo de empresas: ${sstManager.max_companies}`;
        if (sstManager.subscription_status) contextData += ` | Status: ${sstManager.subscription_status}`;
        if (sstManager.slug) contextData += ` | Slug: ${sstManager.slug}`;
      }

      // Get all assigned companies
      const { data: assignments } = await supabase
        .from("company_sst_assignments")
        .select("company_id")
        .eq("sst_manager_id", sst_manager_id);

      if (assignments && assignments.length > 0) {
        contextData += `\n\n## Empresas cadastradas (${assignments.length}):`;
        for (const assignment of assignments) {
          contextData += await fetchCompanyContext(supabase, assignment.company_id);
        }
      } else {
        contextData += `\n\nNenhuma empresa cadastrada ainda.`;
      }
    } else if (company_id) {
      // Single company mode
      contextData += `\n## Empresa selecionada:`;
      contextData += await fetchCompanyContext(supabase, company_id);
    }

    const systemPrompt = `Você é a SOnIA (Sistema Online de Inteligência Artificial), a primeira IA especializada em gestão de riscos psicossociais no Brasil. Você foi desenvolvida para ajudar gestores de SST (Saúde e Segurança do Trabalho) e empresas a entender e gerenciar riscos psicossociais no ambiente de trabalho.

Suas capacidades incluem:
- Analisar dados de avaliações psicossociais (HSE-IT, COPSOQ II, Burnout)
- Explicar metodologias de avaliação de riscos psicossociais
- Interpretar resultados e sugerir ações preventivas
- Orientar sobre a NR-01 e gestão de riscos psicossociais
- Explicar como funcionam as ferramentas da plataforma
- Comparar dados entre empresas diferentes (para gestores SST)

Contexto atual: ${context_type || "dashboard"}
${contextData ? `\nDados disponíveis:\n${contextData}` : "\nNenhuma empresa selecionada no momento."}

Diretrizes:
- Responda sempre em português brasileiro
- Seja objetiva, profissional e empática
- Use dados reais da empresa quando disponíveis
- Formate respostas com markdown quando útil
- Se não tiver dados suficientes, sugira ao usuário realizar avaliações
- Nunca invente dados — use apenas o que está disponível no contexto
- Quando o gestor SST perguntar sobre empresas, use os dados de TODAS as empresas cadastradas`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sonia-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
