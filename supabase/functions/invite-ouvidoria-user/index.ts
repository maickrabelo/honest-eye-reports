import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function emailTemplate(opts: {
  inviterName: string;
  companyName: string;
  acceptUrl: string;
  accessLabel: string;
}): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#0f3460,#1a97b9);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:26px;">SOIA</h1>
    <p style="color:#dbeafe;margin:8px 0 0;font-size:14px;">Canal de Ouvidoria</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="color:#0f3460;margin-top:0;">Você foi convidado(a) para a ouvidoria</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      <strong>${opts.inviterName}</strong> convidou você para acompanhar o canal de ouvidoria da
      <strong>${opts.companyName}</strong> com o perfil <strong>${opts.accessLabel}</strong>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${opts.acceptUrl}" style="background:#1a97b9;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Aceitar convite e criar senha</a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.5;">
      Ou copie este link:<br><span style="color:#1a97b9;word-break:break-all;">${opts.acceptUrl}</span>
    </p>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
      As denúncias são confidenciais. O acesso é registrado em log de auditoria.
    </p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px;text-align:center;color:#6b7280;font-size:12px;">
    © ${new Date().getFullYear()} SOIA · soia.app.br
  </td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await caller.auth.getClaims(token);
    if (cErr || !claims?.claims) return json({ error: "Token inválido" }, 401);

    const callerId = claims.claims.sub as string;
    const callerEmail = (claims.claims.email as string | undefined) ?? "";
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const company_id = body.company_id as string;
    const email = String(body.email ?? "").trim().toLowerCase();
    const full_name = String(body.full_name ?? "").trim();
    const job_title = String(body.job_title ?? "").trim() || null;
    const access_type = body.access_type === "auditor" ? "auditor" : "gestor";

    if (!company_id) return json({ error: "Empresa não informada" }, 400);
    if (!email.includes("@") || email.length > 255) return json({ error: "E-mail inválido" }, 400);
    if (!full_name || full_name.length > 200) return json({ error: "Nome inválido" }, 400);

    // Permissão
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) {
      const { data: canEdit } = await admin.rpc("ouvidoria_can_edit_for", {
        _user_id: callerId,
        _company_id: company_id,
      }).catch(() => ({ data: null } as any));

      let allowed = canEdit === true;
      if (!allowed) {
        const { data: inCompany } = await admin.rpc("user_in_company", {
          _user_id: callerId,
          _company_id: company_id,
        });
        const { data: managesCompany } = await admin.rpc("user_manages_company", {
          _user_id: callerId,
          _company_id: company_id,
        });
        allowed = Boolean(inCompany || managesCompany);
      }
      if (!allowed) return json({ error: "Sem permissão para convidar nesta empresa." }, 403);

      // Auditor não pode convidar
      const { data: me } = await admin
        .from("ouvidoria_users")
        .select("access_type")
        .eq("company_id", company_id)
        .eq("user_id", callerId)
        .eq("status", "active")
        .maybeSingle();
      if (me?.access_type === "auditor") {
        return json({ error: "Auditores não podem convidar usuários." }, 403);
      }
    }

    const { data: existingUser } = await admin
      .from("ouvidoria_users")
      .select("id, status")
      .eq("company_id", company_id)
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return json({ error: "Este e-mail já possui acesso ou convite nesta ouvidoria." }, 409);
    }

    // Usuário já existe na plataforma?
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()
      .catch(() => ({ data: null } as any));

    const { error: ouErr } = await admin.from("ouvidoria_users").insert({
      company_id,
      email,
      full_name,
      job_title,
      access_type,
      status: existingProfile?.id ? "active" : "pending",
      user_id: existingProfile?.id ?? null,
      invited_by: callerId,
    });
    if (ouErr) {
      console.error("ouvidoria_users insert", ouErr);
      return json({ error: "Erro ao registrar usuário da ouvidoria." }, 500);
    }

    // Convite de conta (reaproveita o fluxo /convite/:token)
    const inviteToken = generateToken();
    const { error: invErr } = await admin.from("account_invitations").insert({
      email,
      account_type: "company",
      company_id,
      invited_by: callerId,
      token: inviteToken,
    });
    if (invErr) console.error("account_invitations insert", invErr);

    const { data: company } = await admin
      .from("companies")
      .select("name")
      .eq("id", company_id)
      .maybeSingle();
    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", callerId)
      .maybeSingle();

    const acceptUrl = `https://soia.app.br/convite/${inviteToken}`;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") ?? Deno.env.get("RESEND_API_KEY");

    if (LOVABLE_API_KEY && RESEND_API_KEY) {
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
            to: [email],
            subject: `Convite para a ouvidoria da ${company?.name ?? "empresa"}`,
            html: emailTemplate({
              inviterName: inviterProfile?.full_name || callerEmail || "Um colega",
              companyName: company?.name ?? "sua empresa",
              acceptUrl,
              accessLabel: access_type === "auditor" ? "Auditor (somente leitura)" : "Gestor",
            }),
          }),
        });
        if (!resp.ok) {
          console.error("resend failed", resp.status, await resp.text().catch(() => ""));
        }
      } catch (e) {
        console.error("email error", e);
      }
    }

    return json({ success: true, accept_url: acceptUrl });
  } catch (e) {
    console.error("unexpected", e);
    return json({ error: "Erro interno" }, 500);
  }
});
