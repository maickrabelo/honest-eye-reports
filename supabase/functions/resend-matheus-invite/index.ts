// One-off: resends invite email for Matheus using existing token
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const acceptUrl = "https://soia.app.br/convite/3256751b8d473d1fa58d15595ee5e863c4440c6cdf6e512ac7ede6ed491f58b8";
  const email = "matheus.gaspar@nrsaudeseguranca.com.br";
  const inviterName = "Equipe NR Saúde e Segurança";
  const accountName = "NR Saúde e Segurança";

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
<tr><td style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:32px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:26px;">SOIA</h1>
<p style="color:#dbeafe;margin:8px 0 0;font-size:14px;">Sistema de Gestão NR-01</p>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#1e3a8a;margin-top:0;">Você foi convidado(a)!</h2>
<p style="color:#374151;font-size:16px;line-height:1.6;"><strong>${inviterName}</strong> convidou você para colaborar na conta <strong>${accountName}</strong> no SOIA.</p>
<p style="color:#374151;font-size:16px;line-height:1.6;">Ao aceitar, você terá acesso ao mesmo dashboard e ferramentas da conta.</p>
<div style="text-align:center;margin:32px 0;"><a href="${acceptUrl}" style="background:#3b82f6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Aceitar convite</a></div>
<p style="color:#6b7280;font-size:13px;line-height:1.5;">Ou copie este link: <br><span style="color:#3b82f6;word-break:break-all;">${acceptUrl}</span></p>
<p style="color:#9ca3af;font-size:12px;margin-top:24px;">Este convite expira em 7 dias.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:20px;text-align:center;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} SOIA · soia.app.br</td></tr>
</table></td></tr></table></body></html>`;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") ?? Deno.env.get("RESEND_API_KEY")!;

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
      subject: `${inviterName} convidou você para ${accountName} no SOIA`,
      html,
    }),
  });

  const body = await resp.text();
  return new Response(JSON.stringify({ status: resp.status, body }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
