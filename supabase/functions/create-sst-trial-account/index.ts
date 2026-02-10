import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SST-TRIAL] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { sst_name, cnpj, email, responsible_name, phone } = await req.json();

    // Validation
    if (!sst_name || !cnpj || !email || !responsible_name) {
      return new Response(
        JSON.stringify({ error: "Nome da gestora, CNPJ, email e nome do responsável são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract only digits from CNPJ for password
    const cnpjDigits = cnpj.replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      return new Response(
        JSON.stringify({ error: "CNPJ inválido. Deve conter 14 dígitos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Input validated", { sst_name, email, responsible_name });

    // Check if email is already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "Este email já está cadastrado no sistema." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use CNPJ digits as initial password
    const tempPassword = cnpjDigits;
    logStep("Password set to CNPJ digits");

    // Generate slug from SST name
    const slug = sst_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for slug uniqueness
    const { data: existingSlug } = await supabaseAdmin
      .from("sst_managers")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // 1. Create SST manager with max_companies = 1
    const { data: sstManager, error: sstError } = await supabaseAdmin
      .from("sst_managers")
      .insert({
        name: sst_name,
        cnpj: cnpjDigits,
        email: email.trim().toLowerCase(),
        phone: phone || null,
        slug: finalSlug,
        max_companies: 1,
        subscription_status: "trial",
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select()
      .single();

    if (sstError) {
      logStep("Error creating SST manager", sstError);
      throw new Error(`Erro ao criar gestora SST: ${sstError.message}`);
    }

    logStep("SST manager created", { sstManagerId: sstManager.id });

    // 2. Create auth user
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: responsible_name,
      },
    });

    if (createUserError) {
      logStep("Error creating user", createUserError);
      // Rollback: delete SST manager
      await supabaseAdmin.from("sst_managers").delete().eq("id", sstManager.id);
      throw new Error(`Erro ao criar usuário: ${createUserError.message}`);
    }

    const userId = newUser.user.id;
    logStep("User created", { userId });

    // 3. Update profile with sst_manager_id and must_change_password
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        sst_manager_id: sstManager.id,
        must_change_password: true,
        full_name: responsible_name,
      })
      .eq("id", userId);

    if (profileError) {
      logStep("Error updating profile", profileError);
    }

    // 4. Update user role from 'pending' to 'sst'
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "sst" })
      .eq("user_id", userId);

    if (roleError) {
      logStep("Error updating role, trying insert", roleError);
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "sst" });
    }

    logStep("Role updated to sst");

    // 5. Send welcome email with credentials
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        const trialEndFormatted = trialEndsAt.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        await resend.emails.send({
          from: "SOIA <noreply@sfrfranco.com.br>",
          to: [email.trim().toLowerCase()],
          subject: "Bem-vindo ao SOIA - Teste Grátis para Gestoras SST",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0F5132; margin: 0;">Bem-vindo ao SOIA!</h1>
                <p style="color: #666; font-size: 16px;">Seu período de teste gratuito para Gestoras SST começou</p>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">Seus dados de acesso:</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Senha inicial:</strong> Seu CNPJ (apenas números)</p>
                <p style="color: #dc3545; font-size: 14px;">⚠️ No primeiro acesso, você será solicitado a criar uma nova senha por segurança.</p>
              </div>
              
              <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #2e7d32; margin-top: 0;">📅 Seu trial expira em: ${trialEndFormatted}</h3>
                <p style="color: #555;">Durante o período de teste, você pode cadastrar <strong>1 empresa</strong> para explorar todas as funcionalidades.</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${req.headers.get("origin") || "https://honest-eye-reports.lovable.app"}/auth" 
                   style="background: #0F5132; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Acessar a Plataforma
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                Gestora SST: ${sst_name} | Plano: Trial (7 dias) | Limite: 1 empresa
              </p>
            </div>
          `,
        });

        logStep("Welcome email sent");
      } catch (emailError) {
        logStep("Error sending email (non-fatal)", emailError);
      }
    } else {
      logStep("RESEND_API_KEY not configured, skipping email");
    }

    return new Response(
      JSON.stringify({
        success: true,
        sst_manager_id: sstManager.id,
        user_id: userId,
        trial_ends_at: trialEndsAt.toISOString(),
        message: "Conta trial SST criada com sucesso! Verifique seu email para os dados de acesso.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
