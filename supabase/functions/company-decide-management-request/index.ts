import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailShell, itemsTable, sendEmail } from "../_shared/operatorEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ACTIONS: Record<string, string> = {
  grant: "active",
  reject: "rejected",
  revoke: "revoked",
};

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
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const requestId = String((body as any).requestId ?? "").trim();
    const action = String((body as any).action ?? "").trim();
    const newStatus = ACTIONS[action];
    if (!requestId || !newStatus) return json({ error: "Solicitação ou ação inválida." }, 400);

    const { data: request } = await supabase
      .from("licensed_operator_management_requests")
      .select("*, licensed_operators(nome_fantasia, razao_social, email, logo_url), companies(name)")
      .eq("id", requestId)
      .maybeSingle();
    if (!request) return json({ error: "Solicitação não encontrada." }, 404);

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin") ?? false;

    const { data: canDecide } = await supabase.rpc("is_company_primary_admin", {
      _user_id: user.id,
      _company_id: request.company_id,
    });

    if (!isAdmin && !canDecide) {
      return json({ error: "Apenas o administrador principal da empresa pode decidir." }, 403);
    }

    const { error: updErr } = await supabase
      .from("licensed_operator_management_requests")
      .update({ status: newStatus, decided_by: user.id, decided_at: new Date().toISOString() })
      .eq("id", requestId);
    if (updErr) return json({ error: updErr.message }, 400);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const operator: any = request.licensed_operators;
    const partnerName = operator?.nome_fantasia || operator?.razao_social || "Parceiro licenciado";

    await supabase.from("company_audit_logs").insert({
      company_id: request.company_id,
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.full_name ?? null,
      action:
        newStatus === "active"
          ? "operator_management_granted"
          : newStatus === "rejected"
            ? "operator_management_rejected"
            : "operator_management_revoked",
      entity_type: "licensed_operator_management_request",
      entity_id: requestId,
      details: { partner: partnerName },
    });

    if (operator?.email) {
      const label =
        newStatus === "active"
          ? "autorizou"
          : newStatus === "rejected"
            ? "recusou"
            : "revogou";
      const html = emailShell(
        `
        <h2 style="margin:0 0 12px">Atualização da solicitação de gerenciamento</h2>
        <p style="line-height:1.6;color:#334155">
          A empresa <strong>${(request.companies as any)?.name ?? ""}</strong> ${label} o gerenciamento
          do Canal de Ouvidoria.
        </p>
        ${itemsTable([
          ["Empresa", (request.companies as any)?.name ?? "-"],
          ["Situação", newStatus === "active" ? "Autorizado" : newStatus === "rejected" ? "Recusado" : "Revogado"],
        ])}
        `,
        operator.logo_url,
      );
      await sendEmail(operator.email, `Gerenciamento do canal — ${label}`, html);
    }

    return json({ status: newStatus });
  } catch (err) {
    console.error("[company-decide-management-request]", err);
    return json({ error: "Erro inesperado." }, 500);
  }
});
