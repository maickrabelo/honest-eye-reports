import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function template(opts: { companyName: string; message: string; url: string }) {
  const paragraphs = opts.message
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => `<p style="color:#374151;font-size:16px;line-height:1.6;">${escapeHtml(p)}</p>`)
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#0f3460,#1a97b9);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Canal de Ouvidoria</h1>
    <p style="color:#dbeafe;margin:8px 0 0;font-size:14px;">${escapeHtml(opts.companyName)}</p>
  </td></tr>
  <tr><td style="padding:32px;">
    ${paragraphs}
    <div style="text-align:center;margin:32px 0;">
      <a href="${opts.url}" style="background:#1a97b9;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Acessar o canal</a>
    </div>
    <p style="color:#6b7280;font-size:13px;">
      O relato pode ser anônimo. Você recebe um protocolo para acompanhar o andamento.
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px;text-align:center;color:#6b7280;font-size:12px;">
    Enviado por ${escapeHtml(opts.companyName)} via SOIA · soia.app.br
  </td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: cErr } = await caller.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (cErr || !claims?.claims) return json({ error: "Token inválido" }, 401);
    const callerId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();

    const company_id = body.company_id as string;
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const channel_url = String(body.channel_url ?? "").trim();
    const rawEmails: string[] = Array.isArray(body.emails) ? body.emails : [];

    if (!company_id) return json({ error: "Empresa não informada" }, 400);
    if (!subject || subject.length > 200) return json({ error: "Assunto inválido" }, 400);
    if (!message || message.length > 5000) return json({ error: "Mensagem inválida" }, 400);
    if (!/^https?:\/\//.test(channel_url)) return json({ error: "Link do canal inválido" }, 400);

    const emails = Array.from(
      new Set(
        rawEmails
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(e)),
      ),
    ).slice(0, 1000);

    if (emails.length === 0) return json({ error: "Nenhum e-mail válido informado" }, 400);

    // Permissão
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) {
      const { data: inCompany } = await admin.rpc("user_in_company", {
        _user_id: callerId,
        _company_id: company_id,
      });
      const { data: managesCompany } = await admin.rpc("user_manages_company", {
        _user_id: callerId,
        _company_id: company_id,
      });
      const { data: ouUser } = await admin
        .from("ouvidoria_users")
        .select("access_type")
        .eq("company_id", company_id)
        .eq("user_id", callerId)
        .eq("status", "active")
        .maybeSingle();

      const allowed = (inCompany || managesCompany || ouUser) && ouUser?.access_type !== "auditor";
      if (!allowed) return json({ error: "Sem permissão para disparar campanhas." }, 403);
    }

    const { data: company } = await admin
      .from("companies")
      .select("name")
      .eq("id", company_id)
      .maybeSingle();

    const { data: campaign } = await admin
      .from("ouvidoria_campaigns")
      .insert({
        company_id,
        subject,
        message,
        channel_url,
        recipients_count: emails.length,
        status: "sending",
        created_by: callerId,
      })
      .select("id")
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") ?? Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      if (campaign) {
        await admin
          .from("ouvidoria_campaigns")
          .update({ status: "failed", error_message: "Serviço de e-mail indisponível" })
          .eq("id", campaign.id);
      }
      return json({ error: "Serviço de e-mail indisponível" }, 500);
    }

    const html = template({
      companyName: company?.name ?? "Sua empresa",
      message,
      url: channel_url,
    });

    let sent = 0;
    let failed = 0;

    // Envia em lotes para não estourar limites
    const batchSize = 20;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (to) => {
          try {
            const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "X-Connection-Api-Key": RESEND_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "SOIA <noreply@soia.app.br>",
                to: [to],
                subject,
                html,
              }),
            });
            if (!resp.ok) {
              console.error("resend failed", to, resp.status);
              return false;
            }
            return true;
          } catch (e) {
            console.error("send error", to, e);
            return false;
          }
        }),
      );
      results.forEach((ok) => (ok ? sent++ : failed++));
    }

    if (campaign) {
      await admin
        .from("ouvidoria_campaigns")
        .update({
          status: failed === emails.length ? "failed" : "sent",
          sent_count: sent,
          failed_count: failed,
        })
        .eq("id", campaign.id);
    }

    return json({ success: true, sent, failed });
  } catch (e) {
    console.error("unexpected", e);
    return json({ error: "Erro interno" }, 500);
  }
});
