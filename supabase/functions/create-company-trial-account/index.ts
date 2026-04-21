import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) => {
  console.log(`[CREATE-COMPANY-TRIAL] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { company_name, cnpj, email, responsible_name, phone, employee_count, plan_slug } = await req.json();

    if (!company_name || !cnpj || !email || !responsible_name || !phone) {
      return new Response(JSON.stringify({ error: "Preencha todos os campos obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cnpjDigits = String(cnpj).replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      return new Response(JSON.stringify({ error: "CNPJ inválido. Deve conter 14 dígitos." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check existing user
    const { data: existing } = await supabase.auth.admin.listUsers();
    if (existing?.users?.some((u: any) => u.email?.toLowerCase() === normalizedEmail)) {
      return new Response(JSON.stringify({ error: "Este email já está cadastrado." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Slug
    const baseSlug = String(company_name)
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: slugExists } = await supabase.from("companies").select("id").eq("slug", baseSlug).maybeSingle();
    const slug = slugExists ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // 1. Company
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert({
        name: company_name,
        cnpj: cnpjDigits,
        email: normalizedEmail,
        phone,
        slug,
        max_employees: Number(employee_count) || 50,
        employee_count: Number(employee_count) || 0,
        subscription_status: "trial",
        trial_ends_at: trialEndsAt.toISOString(),
        trial_plan_slug: plan_slug || null,
      })
      .select()
      .single();

    if (companyErr) throw new Error(`Erro ao criar empresa: ${companyErr.message}`);
    log("company created", { id: company.id });

    // 2. Auth user — initial password = CNPJ digits
    const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: cnpjDigits,
      email_confirm: true,
      user_metadata: { full_name: responsible_name },
    });

    if (userErr) {
      await supabase.from("companies").delete().eq("id", company.id);
      throw new Error(`Erro ao criar usuário: ${userErr.message}`);
    }

    const userId = newUser.user.id;

    // 3. Profile
    await supabase.from("profiles").update({
      company_id: company.id,
      must_change_password: true,
      full_name: responsible_name,
    }).eq("id", userId);

    // 3b. Link user to company (multi-company access table)
    const { error: linkErr } = await supabase.from("user_companies").insert({
      user_id: userId,
      company_id: company.id,
      is_default: true,
    });
    if (linkErr) log("user_companies link warning", linkErr.message);

    // 4. Role: company
    const { error: roleErr } = await supabase.from("user_roles")
      .update({ role: "company" }).eq("user_id", userId);
    if (roleErr) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "company" });
    }

    // 5. Enable all features
    await supabase.from("company_feature_access").upsert({
      company_id: company.id,
      ouvidoria_enabled: true,
      psicossocial_enabled: true,
      burnout_enabled: true,
      clima_enabled: true,
      treinamentos_enabled: true,
    });

    log("setup complete", { userId, companyId: company.id });

    // 6. Email
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const trialFmt = trialEndsAt.toLocaleDateString("pt-BR");
        const origin = req.headers.get("origin") || "https://soia.app.br";
        await resend.emails.send({
          from: "SOIA <noreply@sfrfranco.com.br>",
          to: [normalizedEmail],
          subject: "Bem-vindo ao SOIA — seu teste grátis começou!",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h1 style="color:#0F5132">Bem-vindo ao SOIA!</h1>
              <p>Seu período de teste gratuito de <strong>7 dias</strong> começou.</p>
              <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0">
                <p><strong>Email:</strong> ${normalizedEmail}</p>
                <p><strong>Senha inicial:</strong> ${cnpjDigits} (seu CNPJ apenas números)</p>
                <p style="color:#dc3545;font-size:14px">⚠️ Você será solicitado a criar uma nova senha no primeiro acesso.</p>
              </div>
              <div style="background:#e8f5e9;border-radius:8px;padding:20px;margin:20px 0">
                <h3 style="color:#2e7d32;margin:0">📅 Trial expira em: ${trialFmt}</h3>
                <p>Aproveite para explorar Ouvidoria, Riscos Psicossociais (HSE-IT/COPSOQ), Burnout, Clima e Treinamentos.</p>
              </div>
              <p style="text-align:center">
                <a href="${origin}/auth" style="background:#0F5132;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;font-weight:bold">Acessar plataforma</a>
              </p>
              <p style="color:#999;font-size:12px;text-align:center">${company_name} · Plano Trial Empresa (7 dias)</p>
            </div>
          `,
        });
      } catch (e) { log("email error (non-fatal)", String(e)); }
    }

    return new Response(JSON.stringify({
      success: true,
      company_id: company.id,
      user_id: userId,
      trial_ends_at: trialEndsAt.toISOString(),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    log("ERROR", error?.message);
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
