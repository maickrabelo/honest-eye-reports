import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);

    const to = "buzzmktsocial@gmail.com";
    const tempPassword = `Trial${Math.random().toString(36).substring(2, 8)}!${Math.floor(Math.random() * 100)}`;
    const companyName = "Buzz Marketing Social";
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    const trialEndFormatted = trialEnd.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

    const logoUrl = "https://soia.app.br/lovable-uploads/Logo_SOIA.png";

    const result = await resend.emails.send({
      from: "SOIA <noreply@soia.app.br>",
      to: [to],
      subject: "Bem-vindo ao SOIA - Seu período de teste começou!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${logoUrl}" alt="SOIA" style="max-width: 180px; height: auto; margin-bottom: 20px;" />
            <h1 style="color: #0F5132; margin: 0;">Bem-vindo ao SOIA!</h1>
            <p style="color: #666; font-size: 16px;">Seu período de teste gratuito de 7 dias começou</p>
          </div>

          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Seus dados de acesso:</h2>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Senha temporária:</strong> ${tempPassword}</p>
            <p style="color: #dc3545; font-size: 14px;">⚠️ Você será solicitado a alterar a senha no primeiro acesso.</p>
          </div>

          <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #2e7d32; margin-top: 0;">📅 Seu trial expira em: ${trialEndFormatted}</h3>
            <p style="color: #555;">Aproveite para explorar todas as funcionalidades da plataforma!</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://soia.app.br/auth"
               style="background: #0F5132; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Acessar a Plataforma
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            Empresa: ${companyName} | Plano: Trial (7 dias)
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, result, tempPassword }), {
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
