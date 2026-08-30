import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailShell, itemsTable, ctaButton, sendEmail } from "../_shared/operatorEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Não autenticado." }, 401);
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) return json({ error: "Sessão inválida." }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const companyId = String((body as any).companyId ?? "").trim();
    if (!companyId) return json({ error: "Empresa não informada." }, 400);

    const { data: operator } = await supabase
      .from("licensed_operators")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!operator) return json({ error: "Parceiro licenciado não encontrado." }, 403);
    if (operator.status !== "active") return json({ error: "Parceiro licenciado inativo." }, 403);

    const { data: link } = await supabase
      .from("licensed_operator_companies")
      .select("id")
      .eq("operator_id", operator.id)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!link) return json({ error: "Esta empresa não está vinculada a você." }, 403);

    const { data: company } = await supabase
      .from("companies")
      .select("id, name, email, notification_email_1, slug")
      .eq("id", companyId)
      .maybeSingle();
    if (!company) return json({ error: "Empresa não encontrada." }, 404);

    const { data: existing } = await supabase
      .from("licensed_operator_management_requests")
      .select("*")
      .eq("operator_id", operator.id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (existing?.status === "active") {
      return json({ status: "active", message: "Você já tem acesso autorizado." });
    }

    if (existing) {
      const { error } = await supabase
        .from("licensed_operator_management_requests")
        .update({ status: "pending", requested_by: userId, decided_by: null, decided_at: null })
        .eq("id", existing.id);
      if (error) return json({ error: error.message }, 400);
    } else {
      const { error } = await supabase
        .from("licensed_operator_management_requests")
        .insert({
          operator_id: operator.id,
          company_id: companyId,
          status: "pending",
          requested_by: userId,
        });
      if (error) return json({ error: error.message }, 400);
    }

    const partnerName = operator.nome_fantasia || operator.razao_social;
    const recipients = [company.email, company.notification_email_1]
      .filter((e): e is string => Boolean(e && e.includes("@")))
      .filter((e, i, arr) => arr.indexOf(e) === i);

    const html = emailShell(
      `
      <h2 style="margin:0 0 12px">Solicitação de gerenciamento do seu Canal de Ouvidoria</h2>
      <p style="line-height:1.6;color:#334155">
        A empresa <strong>${partnerName}</strong>, Parceiro Licenciado SOIA, solicitou permissão para
        gerenciar o Canal de Ouvidoria de <strong>${company.name}</strong>.
      </p>
      ${itemsTable([
        ["Solicitante", partnerName],
        ["Empresa", company.name],
        ["Permissão solicitada", "Gerenciar denúncias, tarefas e notas do canal"],
      ])}
      <p style="line-height:1.6;color:#334155">
        Para autorizar ou recusar, entre na sua conta SOIA e clique no aviso que aparece no topo do seu dashboard.
        Enquanto você não autorizar, o parceiro não tem qualquer acesso aos dados do canal.
      </p>
      ${ctaButton("https://soia.app.br/auth", "Entrar e revisar solicitação")}
      `,
      operator.logo_url,
    );

    for (const to of recipients) {
      await sendEmail(to, `${partnerName} solicitou o gerenciamento do seu Canal de Ouvidoria`, html);
    }

    return json({ status: "pending", notified: recipients.length });
  } catch (err) {
    console.error("[licensed-operator-request-management]", err);
    return json({ error: "Erro inesperado ao solicitar gerenciamento." }, 500);
  }
});
