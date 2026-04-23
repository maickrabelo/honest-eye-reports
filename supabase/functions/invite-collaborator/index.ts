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
  accountName: string;
  acceptUrl: string;
}): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:26px;">SOIA</h1>
    <p style="color:#dbeafe;margin:8px 0 0;font-size:14px;">Sistema de Gestão NR-01</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="color:#1e3a8a;margin-top:0;">Você foi convidado(a)!</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      <strong>${opts.inviterName}</strong> convidou você para colaborar na conta
      <strong>${opts.accountName}</strong> no SOIA.
    </p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      Ao aceitar, você terá acesso ao mesmo dashboard e ferramentas da conta.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${opts.acceptUrl}" style="background:#3b82f6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Aceitar convite</a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.5;">
      Ou copie este link: <br><span style="color:#3b82f6;word-break:break-all;">${opts.acceptUrl}</span>
    </p>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Este convite expira em 7 dias.</p>
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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await caller.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claims.claims.sub as string;
    const callerEmail = (claims.claims.email as string | undefined) ?? "";
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const account_type = body.account_type as "sst" | "company";
    const account_id = body.account_id as string;

    if (!email || !email.includes("@") || email.length > 255) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["sst", "company"].includes(account_type) || !account_id) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Autorização: caller pertence à conta?
    if (account_type === "sst") {
      const { data: ok } = await admin.rpc("user_in_sst_manager", {
        _user_id: callerId,
        _sst_manager_id: account_id,
      });
      if (!ok) {
        return new Response(JSON.stringify({ error: "Sem permissão." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { data: ok } = await admin.rpc("user_in_company", {
        _user_id: callerId,
        _company_id: account_id,
      });
      if (!ok) {
        return new Response(JSON.stringify({ error: "Sem permissão." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Já existe convite pendente?
    const { data: existing } = await admin
      .from("account_invitations")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .eq(account_type === "sst" ? "sst_manager_id" : "company_id", account_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Já existe um convite pendente para este e-mail." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const inviteToken = generateToken();

    const insertPayload: any = {
      email,
      account_type,
      invited_by: callerId,
      token: inviteToken,
    };
    if (account_type === "sst") insertPayload.sst_manager_id = account_id;
    else insertPayload.company_id = account_id;

    const { data: inv, error: iErr } = await admin
      .from("account_invitations")
      .insert(insertPayload)
      .select()
      .single();

    if (iErr) {
      console.error("insert error", iErr);
      return new Response(JSON.stringify({ error: "Erro ao criar convite." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar nome da conta
    let accountName = "sua equipe";
    if (account_type === "sst") {
      const { data } = await admin.from("sst_managers").select("name").eq("id", account_id).maybeSingle();
      if (data?.name) accountName = data.name;
    } else {
      const { data } = await admin.from("companies").select("name").eq("id", account_id).maybeSingle();
      if (data?.name) accountName = data.name;
    }

    // Buscar nome de quem convidou
    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", callerId)
      .maybeSingle();
    const inviterName = inviterProfile?.full_name || callerEmail || "Um colega";

    // Enviar e-mail via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const acceptUrl = `https://soia.app.br/convite/${inviteToken}`;

    if (RESEND_API_KEY) {
      try {
        const html = emailTemplate({ inviterName, accountName, acceptUrl });
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SOIA <onboarding@resend.dev>",
            to: [email],
            subject: `${inviterName} convidou você para ${accountName} no SOIA`,
            html,
          }),
        });
        if (!resp.ok) {
          console.error("resend failed", await resp.text());
        }
      } catch (e) {
        console.error("email error", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation_id: inv.id,
        accept_url: acceptUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("unexpected", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
