import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, name, tempPassword, planName, maxCompanies } = await req.json();
    if (!to || !tempPassword) throw new Error("to e tempPassword obrigatórios");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");
    const resend = new Resend(resendApiKey);

    const logoUrl = "https://soia.app.br/lovable-uploads/Logo_SOIA.png";

    const result = await resend.emails.send({
      from: "SOIA <noreply@soia.app.br>",
      to: [to],
      subject: "Bem-vindo(a) ao SOIA — conclua o acesso da sua conta Gestora SST",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${logoUrl}" alt="SOIA" style="max-width: 180px; height: auto; margin-bottom: 20px;" />
            <h1 style="color: #0F5132; margin: 0;">Bem-vindo(a) ao SOIA!</h1>
            <p style="color: #666; font-size: 16px;">Sua conta anual de Gestora SST foi criada.</p>
          </div>

          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Seus dados de acesso</h2>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Senha temporária:</strong> <code style="background:#eee;padding:4px 8px;border-radius:4px;font-size:15px;">${tempPassword}</code></p>
            <p style="color: #dc3545; font-size: 14px;">⚠️ No primeiro acesso você será solicitado(a) a alterar a senha e completar o perfil da sua gestora (CNPJ, telefone, endereço, logo etc).</p>
          </div>

          <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #2e7d32; margin-top: 0;">Plano contratado</h3>
            <p style="margin:4px 0;"><strong>Plano:</strong> ${planName || "Gestor Pro (Anual)"}</p>
            <p style="margin:4px 0;"><strong>Empresas liberadas:</strong> ${maxCompanies || 30}</p>
            <p style="margin:4px 0;"><strong>Recursos:</strong> Todos os módulos liberados (Psicossocial HSE-IT, COPSOQ, Burnout, Clima, PGR, Treinamentos, Ouvidoria padrão, IA SOnIA).</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://soia.app.br/auth"
               style="background: #0F5132; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display:inline-block;">
              Acessar a Plataforma
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            ${name || ""} · Se precisar de ajuda, responda este e-mail ou chame nosso suporte.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
