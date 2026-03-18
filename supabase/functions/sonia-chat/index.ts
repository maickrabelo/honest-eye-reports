import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, company_id, context_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company context data
    let contextData = "";

    if (company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name, cnpj, max_employees")
        .eq("id", company_id)
        .single();

      if (company) {
        contextData += `\n## Empresa: ${company.name}`;
        if (company.cnpj) contextData += ` (CNPJ: ${company.cnpj})`;
        if (company.max_employees) contextData += `\nNúmero máximo de funcionários: ${company.max_employees}`;
      }

      // Reports stats
      const { count: totalReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company_id);

      const { count: pendingReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company_id)
        .eq("status", "pending");

      contextData += `\n\n## Denúncias: ${totalReports || 0} total, ${pendingReports || 0} pendentes`;

      // HSE-IT assessments
      const { data: hseitAssessments } = await supabase
        .from("hseit_assessments")
        .select("id, title, is_active")
        .eq("company_id", company_id);

      if (hseitAssessments && hseitAssessments.length > 0) {
        contextData += `\n\n## Avaliações HSE-IT: ${hseitAssessments.length}`;
        for (const a of hseitAssessments) {
          const { count } = await supabase
            .from("hseit_responses")
            .select("*", { count: "exact", head: true })
            .eq("assessment_id", a.id);
          contextData += `\n- ${a.title}: ${count || 0} respostas (${a.is_active ? "ativa" : "inativa"})`;
        }
      }

      // COPSOQ assessments
      const { data: copsoqAssessments } = await supabase
        .from("copsoq_assessments")
        .select("id, title, is_active")
        .eq("company_id", company_id);

      if (copsoqAssessments && copsoqAssessments.length > 0) {
        contextData += `\n\n## Avaliações COPSOQ II: ${copsoqAssessments.length}`;
        for (const a of copsoqAssessments) {
          const { count } = await supabase
            .from("copsoq_responses")
            .select("*", { count: "exact", head: true })
            .eq("assessment_id", a.id);
          contextData += `\n- ${a.title}: ${count || 0} respostas (${a.is_active ? "ativa" : "inativa"})`;
        }
      }

      // Burnout assessments
      const { data: burnoutAssessments } = await supabase
        .from("burnout_assessments")
        .select("id, title, is_active")
        .eq("company_id", company_id);

      if (burnoutAssessments && burnoutAssessments.length > 0) {
        contextData += `\n\n## Avaliações de Burnout: ${burnoutAssessments.length}`;
        for (const a of burnoutAssessments) {
          const { count } = await supabase
            .from("burnout_responses")
            .select("*", { count: "exact", head: true })
            .eq("assessment_id", a.id);
          contextData += `\n- ${a.title}: ${count || 0} respostas (${a.is_active ? "ativa" : "inativa"})`;
        }
      }
    }

    const systemPrompt = `Você é a SOnIA (Sistema Online de Inteligência Artificial), a primeira IA especializada em gestão de riscos psicossociais no Brasil. Você foi desenvolvida para ajudar gestores de SST (Saúde e Segurança do Trabalho) e empresas a entender e gerenciar riscos psicossociais no ambiente de trabalho.

Suas capacidades incluem:
- Analisar dados de avaliações psicossociais (HSE-IT, COPSOQ II, Burnout)
- Explicar metodologias de avaliação de riscos psicossociais
- Interpretar resultados e sugerir ações preventivas
- Orientar sobre a NR-01 e gestão de riscos psicossociais
- Explicar como funcionam as ferramentas da plataforma

Contexto atual: ${context_type || "dashboard"}
${contextData ? `\nDados da empresa:\n${contextData}` : "\nNenhuma empresa selecionada no momento."}

Diretrizes:
- Responda sempre em português brasileiro
- Seja objetiva, profissional e empática
- Use dados reais da empresa quando disponíveis
- Formate respostas com markdown quando útil
- Se não tiver dados suficientes, sugira ao usuário realizar avaliações
- Nunca invente dados — use apenas o que está disponível no contexto`;

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
