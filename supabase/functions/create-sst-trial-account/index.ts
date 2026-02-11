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

const DEPARTMENTS = ["Administrativo", "Operacional", "Comercial", "RH", "TI"];

// Department bias profiles for realistic data (higher = better scores)
const DEPT_BIAS: Record<string, number> = {
  "Administrativo": 0.6,
  "Operacional": 0.35,
  "Comercial": 0.55,
  "RH": 0.7,
  "TI": 0.65,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function variedValue(min: number, max: number, bias: number, seed: number): number {
  const r = seededRandom(seed);
  const biased = r * (1 - bias) + bias;
  return Math.round(min + biased * (max - min));
}

// Climate survey open-ended sample answers
const OPEN_ANSWERS: Record<number, string[]> = {
  0: [
    "O ambiente é colaborativo, mas poderia melhorar a comunicação entre setores.",
    "Gosto muito do clima entre os colegas, é respeitoso.",
    "Tem dias bons e ruins, mas no geral é positivo.",
    "Poderia ter mais espaço para diálogo aberto.",
    "Muito bom, me sinto acolhido pela equipe.",
    "Falta integração entre departamentos.",
  ],
  1: [
    "Os colegas de trabalho e o propósito da empresa.",
    "A possibilidade de crescimento profissional.",
    "O salário e os benefícios oferecidos.",
    "O aprendizado constante que tenho aqui.",
    "A flexibilidade e autonomia no trabalho.",
    "Sentir que meu trabalho faz diferença.",
  ],
  2: [
    "Comunicação interna e processos mais claros.",
    "Mais oportunidades de capacitação e treinamento.",
    "Melhor infraestrutura e ferramentas de trabalho.",
    "Feedbacks mais frequentes da liderança.",
    "Plano de carreira mais transparente.",
    "Equilíbrio entre vida pessoal e profissional.",
  ],
  3: [
    "Gostaria de mais reconhecimento pelo trabalho feito.",
    "Seria bom ter reuniões de alinhamento mais frequentes.",
    "Nada a declarar no momento.",
    "Agradeço a oportunidade de participar desta pesquisa.",
    "Precisamos de mais pessoas na equipe.",
    "Gostaria de mais autonomia nas decisões.",
  ],
  4: [
    "Obrigado pela oportunidade de dar feedback.",
    "Espero que os resultados sejam levados em consideração.",
    "Acredito que estamos no caminho certo.",
    "Seria importante revisitar as metas da equipe.",
    "Nada mais a acrescentar.",
    "Sugiro pesquisas como esta com mais frequência.",
  ],
};

async function seedDemoData(supabaseAdmin: any, sstManagerId: string, sstName: string, slug: string, userId: string) {
  logStep("Starting demo data seed");

  // 1. Create demo company
  const demoSlug = `demo-${slug}`;
  const { data: demoCompany, error: companyError } = await supabaseAdmin
    .from("companies")
    .insert({
      name: `Empresa Demo - ${sstName}`,
      slug: demoSlug,
      email: "demo@exemplo.com",
      max_employees: 50,
      subscription_status: "active",
    })
    .select()
    .single();

  if (companyError) {
    logStep("Error creating demo company", companyError);
    return;
  }

  const companyId = demoCompany.id;
  logStep("Demo company created", { companyId });

  // 2. Assign company to SST manager
  const { error: assignError } = await supabaseAdmin
    .from("company_sst_assignments")
    .insert({ company_id: companyId, sst_manager_id: sstManagerId });

  if (assignError) {
    logStep("Error assigning company", assignError);
    return;
  }

  // Generate respondent data (30 respondents, 6 per department)
  const respondents = DEPARTMENTS.flatMap((dept, di) =>
    Array.from({ length: 6 }, (_, i) => ({
      department: dept,
      token: crypto.randomUUID(),
      seed: di * 100 + i,
      bias: DEPT_BIAS[dept],
    }))
  );

  // 3. Seed HSE-IT
  await seedHSEIT(supabaseAdmin, companyId, userId, respondents);

  // 4. Seed Burnout
  await seedBurnout(supabaseAdmin, companyId, userId, respondents);

  // 5. Seed Climate Survey
  await seedClimateSurvey(supabaseAdmin, companyId, respondents);

  logStep("Demo data seed completed");
}

async function seedHSEIT(supabaseAdmin: any, companyId: string, userId: string, respondents: any[]) {
  logStep("Seeding HSE-IT");

  const { data: assessment, error } = await supabaseAdmin
    .from("hseit_assessments")
    .insert({
      company_id: companyId,
      title: "Avaliação HSE-IT Demo",
      description: "Avaliação demonstrativa com dados simulados",
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) { logStep("Error creating HSEIT assessment", error); return; }

  // Create departments
  const deptInserts = DEPARTMENTS.map((name, i) => ({
    assessment_id: assessment.id,
    name,
    employee_count: 10,
    order_index: i,
  }));
  await supabaseAdmin.from("hseit_departments").insert(deptInserts);

  // Create responses
  const responseInserts = respondents.map(r => ({
    assessment_id: assessment.id,
    department: r.department,
    respondent_token: r.token,
    completed_at: new Date().toISOString(),
  }));

  const { data: responses, error: respError } = await supabaseAdmin
    .from("hseit_responses")
    .insert(responseInserts)
    .select("id");

  if (respError) { logStep("Error creating HSEIT responses", respError); return; }

  // Create answers (35 questions per response)
  const answerInserts: any[] = [];
  responses.forEach((resp: any, ri: number) => {
    const r = respondents[ri];
    for (let q = 1; q <= 35; q++) {
      answerInserts.push({
        response_id: resp.id,
        question_number: q,
        answer_value: variedValue(1, 5, r.bias, r.seed * 35 + q),
      });
    }
  });

  // Insert in batches of 500
  for (let i = 0; i < answerInserts.length; i += 500) {
    await supabaseAdmin.from("hseit_answers").insert(answerInserts.slice(i, i + 500));
  }

  logStep("HSE-IT seeded", { responses: responses.length, answers: answerInserts.length });
}

async function seedBurnout(supabaseAdmin: any, companyId: string, userId: string, respondents: any[]) {
  logStep("Seeding Burnout");

  const { data: assessment, error } = await supabaseAdmin
    .from("burnout_assessments")
    .insert({
      company_id: companyId,
      title: "Avaliação Burnout Demo",
      description: "Avaliação demonstrativa com dados simulados",
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) { logStep("Error creating Burnout assessment", error); return; }

  // Create departments
  const deptInserts = DEPARTMENTS.map((name, i) => ({
    assessment_id: assessment.id,
    name,
    employee_count: 10,
    order_index: i,
  }));
  await supabaseAdmin.from("burnout_departments").insert(deptInserts);

  // Create responses with scores
  const responseInserts = respondents.map(r => {
    // Generate answers first to calc total
    let total = 0;
    for (let q = 1; q <= 20; q++) {
      total += variedValue(1, 6, 1 - r.bias, r.seed * 20 + q); // inverted bias for burnout (higher = worse)
    }
    const riskLevel = total <= 40 ? "baixo" : total <= 60 ? "moderado" : total <= 80 ? "alto" : "critico";
    return {
      assessment_id: assessment.id,
      department: r.department,
      respondent_token: r.token,
      completed_at: new Date().toISOString(),
      total_score: total,
      risk_level: riskLevel,
    };
  });

  const { data: responses, error: respError } = await supabaseAdmin
    .from("burnout_responses")
    .insert(responseInserts)
    .select("id");

  if (respError) { logStep("Error creating Burnout responses", respError); return; }

  // Create answers (20 questions per response)
  const answerInserts: any[] = [];
  responses.forEach((resp: any, ri: number) => {
    const r = respondents[ri];
    for (let q = 1; q <= 20; q++) {
      answerInserts.push({
        response_id: resp.id,
        question_number: q,
        answer_value: variedValue(1, 6, 1 - r.bias, r.seed * 20 + q),
      });
    }
  });

  for (let i = 0; i < answerInserts.length; i += 500) {
    await supabaseAdmin.from("burnout_answers").insert(answerInserts.slice(i, i + 500));
  }

  logStep("Burnout seeded", { responses: responses.length, answers: answerInserts.length });
}

async function seedClimateSurvey(supabaseAdmin: any, companyId: string, respondents: any[]) {
  logStep("Seeding Climate Survey");

  const { data: survey, error } = await supabaseAdmin
    .from("climate_surveys")
    .insert({
      company_id: companyId,
      title: "Pesquisa de Clima Demo",
      description: "Pesquisa demonstrativa com dados simulados",
      is_active: true,
    })
    .select()
    .single();

  if (error) { logStep("Error creating Climate Survey", error); return; }

  // Create departments
  const deptInserts = DEPARTMENTS.map((name, i) => ({
    survey_id: survey.id,
    name,
    employee_count: 10,
    order_index: i,
  }));
  await supabaseAdmin.from("survey_departments").insert(deptInserts);

  // Create questions (12 likert + 5 open)
  const likertQuestions = [
    { text: "Você sente que existe colaboração e trabalho em equipe entre os colegas?", category: "ambiente" },
    { text: "Você se sente respeitado(a) e valorizado(a) no ambiente de trabalho?", category: "ambiente" },
    { text: "O ambiente físico e os recursos disponíveis são adequados para realizar seu trabalho?", category: "ambiente" },
    { text: "A comunicação entre a liderança e a equipe é clara e transparente?", category: "lideranca" },
    { text: "Você sente que pode expressar suas opiniões e ideias livremente?", category: "lideranca" },
    { text: "O(a) líder do seu time oferece feedbacks construtivos e com regularidade?", category: "lideranca" },
    { text: "Como você avalia a disponibilidade e abertura da liderança para ouvir a equipe?", category: "lideranca" },
    { text: "Você se sente motivado(a) com seu trabalho?", category: "motivacao" },
    { text: "Você sente que seus esforços e resultados são reconhecidos?", category: "motivacao" },
    { text: "O trabalho que você realiza é desafiador e oferece oportunidades de crescimento?", category: "motivacao" },
    { text: "Você sente que a empresa se preocupa com o seu bem-estar e qualidade de vida?", category: "bemestar" },
    { text: "Você sente que tem equilíbrio entre vida pessoal e profissional?", category: "bemestar" },
  ];

  const openQuestions = [
    { text: "Como você descreveria o ambiente de trabalho na empresa?", category: "open" },
    { text: "O que mais te motiva a trabalhar aqui?", category: "open" },
    { text: "O que você acredita que a empresa poderia melhorar?", category: "open" },
    { text: "Existe algo que você gostaria de compartilhar com a liderança?", category: "open" },
    { text: "Agradecemos a sua participação! Sinta-se à vontade para compartilhar mais algum ponto.", category: "open" },
  ];

  const questionInserts = [
    ...likertQuestions.map((q, i) => ({
      survey_id: survey.id,
      question_text: q.text,
      question_type: "likert" as const,
      category: q.category,
      order_index: i,
      is_required: true,
    })),
    ...openQuestions.map((q, i) => ({
      survey_id: survey.id,
      question_text: q.text,
      question_type: "open_text" as const,
      category: q.category,
      order_index: likertQuestions.length + i,
      is_required: false,
    })),
  ];

  const { data: questions, error: qError } = await supabaseAdmin
    .from("survey_questions")
    .insert(questionInserts)
    .select("id, question_type, order_index");

  if (qError) { logStep("Error creating survey questions", qError); return; }

  // Create responses
  const responseInserts = respondents.map(r => ({
    survey_id: survey.id,
    department: r.department,
    respondent_token: r.token,
    completed_at: new Date().toISOString(),
  }));

  const { data: responses, error: respError } = await supabaseAdmin
    .from("survey_responses")
    .insert(responseInserts)
    .select("id");

  if (respError) { logStep("Error creating survey responses", respError); return; }

  // Create answers
  const answerInserts: any[] = [];
  const sortedQuestions = questions.sort((a: any, b: any) => a.order_index - b.order_index);
  const likertQIds = sortedQuestions.filter((q: any) => q.question_type === "likert");
  const openQIds = sortedQuestions.filter((q: any) => q.question_type === "open_text");

  responses.forEach((resp: any, ri: number) => {
    const r = respondents[ri];
    const respondentIdx = ri % 6;

    // Likert answers
    likertQIds.forEach((q: any, qi: number) => {
      answerInserts.push({
        response_id: resp.id,
        question_id: q.id,
        answer_value: String(variedValue(1, 5, r.bias, r.seed * 17 + qi)),
      });
    });

    // Open text answers
    openQIds.forEach((q: any, qi: number) => {
      const answers = OPEN_ANSWERS[qi] || OPEN_ANSWERS[0];
      answerInserts.push({
        response_id: resp.id,
        question_id: q.id,
        answer_text: answers[respondentIdx % answers.length],
      });
    });
  });

  for (let i = 0; i < answerInserts.length; i += 500) {
    await supabaseAdmin.from("survey_answers").insert(answerInserts.slice(i, i + 500));
  }

  logStep("Climate Survey seeded", { responses: responses.length, answers: answerInserts.length });
}

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
      (u: any) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "Este email já está cadastrado no sistema." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tempPassword = cnpjDigits;

    // Generate slug
    const slug = sst_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: existingSlug } = await supabaseAdmin
      .from("sst_managers")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    // Trial end date (7 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // 1. Create SST manager (max_companies = 2: 1 demo + 1 user)
    const { data: sstManager, error: sstError } = await supabaseAdmin
      .from("sst_managers")
      .insert({
        name: sst_name,
        cnpj: cnpjDigits,
        email: email.trim().toLowerCase(),
        phone: phone || null,
        slug: finalSlug,
        max_companies: 2,
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
      user_metadata: { full_name: responsible_name },
    });

    if (createUserError) {
      logStep("Error creating user", createUserError);
      await supabaseAdmin.from("sst_managers").delete().eq("id", sstManager.id);
      throw new Error(`Erro ao criar usuário: ${createUserError.message}`);
    }

    const userId = newUser.user.id;
    logStep("User created", { userId });

    // 3. Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        sst_manager_id: sstManager.id,
        must_change_password: true,
        full_name: responsible_name,
      })
      .eq("id", userId);

    if (profileError) logStep("Error updating profile", profileError);

    // 4. Update role to 'sst'
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "sst" })
      .eq("user_id", userId);

    if (roleError) {
      logStep("Error updating role, trying insert", roleError);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "sst" });
    }

    logStep("Role updated to sst");

    // 5. Seed demo company with assessments
    try {
      await seedDemoData(supabaseAdmin, sstManager.id, sst_name, finalSlug, userId);
    } catch (seedError) {
      logStep("Error seeding demo data (non-fatal)", seedError);
    }

    // 6. Send welcome email
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const trialEndFormatted = trialEndsAt.toLocaleDateString("pt-BR", {
          day: "2-digit", month: "2-digit", year: "numeric",
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
                <p style="color: #dc3545; font-size: 14px;">⚠️ No primeiro acesso, você será solicitado a criar uma nova senha.</p>
              </div>
              <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #2e7d32; margin-top: 0;">📅 Seu trial expira em: ${trialEndFormatted}</h3>
                <p style="color: #555;">Já criamos uma <strong>Empresa Demo</strong> com avaliações preenchidas para você explorar os dashboards. Você também pode cadastrar <strong>mais 1 empresa</strong> para testar.</p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${req.headers.get("origin") || "https://honest-eye-reports.lovable.app"}/auth" 
                   style="background: #0F5132; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Acessar a Plataforma
                </a>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                Gestora SST: ${sst_name} | Plano: Trial (7 dias) | Limite: 2 empresas (1 demo + 1 própria)
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
