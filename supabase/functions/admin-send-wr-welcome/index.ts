import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    const to = "robert@wrseg.com.br";
    const password = "66201161000151";
    const logoUrl = "https://soia.app.br/lovable-uploads/Logo_SOIA.png";

    const result = await resend.emails.send({
      from: "SOIA <noreply@soia.app.br>",
      to: [to],
      subject: "Bem-vindo ao SOIA — Acesso da WR Medicina e Segurança do Trabalho",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${logoUrl}" alt="SOIA" style="max-width: 180px; height: auto; margin-bottom: 20px;" />
            <h1 style="color: #0F5132; margin: 0;">Bem-vindo ao SOIA, Robert!</h1>
            <p style="color: #666; font-size: 16px;">Sua conta de Gestora SST foi criada com sucesso.</p>
          </div>

          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Seus dados de acesso</h2>
            <p><strong>Empresa:</strong> WR - Medicina e Segurança do Trabalho LTDA - ME</p>
            <p><strong>E-mail de acesso:</strong> ${to}</p>
            <p><strong>Senha inicial:</strong> ${password} <span style="color:#666;">(seu CNPJ, apenas números)</span></p>
            <p style="color: #dc3545; font-size: 14px;">⚠️ No primeiro acesso, você será solicitado a criar uma nova senha.</p>
          </div>

          <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #2e7d32; margin-top: 0;">✅ O que está incluído na sua conta</h3>
            <ul style="color: #555; padding-left: 18px;">
              <li>Cadastro de até <strong>30 empresas</strong> sob sua gestão</li>
              <li>Módulos: Ouvidoria, Psicossocial (HSE-IT/COPSOQ), Burnout, Clima e Treinamentos</li>
              <li>Geração de PGR e dashboards consolidados por empresa</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://soia.app.br/auth"
               style="background: #0F5132; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Acessar a Plataforma
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            Em caso de dúvidas, responda este e-mail que nosso time entrará em contato.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
