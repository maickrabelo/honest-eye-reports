import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SALES-DEMO] ${step}${detailsStr}`);
};

const DEPARTMENTS = ["Administrativo", "Operacional", "Comercial", "RH", "TI"];

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

async function seedHSEIT(supabaseAdmin: any, companyId: string, userId: string, respondents: any[]) {
  logStep("Seeding HSE-IT");
  const { data: assessment, error } = await supabaseAdmin
    .from("hseit_assessments")
    .insert({ company_id: companyId, title: "Avaliação HSE-IT Demo", description: "Avaliação demonstrativa com dados simulados", is_active: true, created_by: userId })
    .select().single();
  if (error) { logStep("Error creating HSEIT assessment", error); return; }

  const deptInserts = DEPARTMENTS.map((name, i) => ({ assessment_id: assessment.id, name, employee_count: 10, order_index: i }));
  await supabaseAdmin.from("hseit_departments").insert(deptInserts);

  const responseInserts = respondents.map(r => ({ assessment_id: assessment.id, department: r.department, respondent_token: r.token, completed_at: new Date().toISOString() }));
  const { data: responses, error: respError } = await supabaseAdmin.from("hseit_responses").insert(responseInserts).select("id");
  if (respError) { logStep("Error creating HSEIT responses", respError); return; }

  const answerInserts: any[] = [];
  responses.forEach((resp: any, ri: number) => {
    const r = respondents[ri];
    for (let q = 1; q <= 35; q++) {
      answerInserts.push({ response_id: resp.id, question_number: q, answer_value: variedValue(1, 5, r.bias, r.seed * 35 + q) });
    }
  });
  for (let i = 0; i < answerInserts.length; i += 500) {
    await supabaseAdmin.from("hseit_answers").insert(answerInserts.slice(i, i + 500));
  }
  logStep("HSE-IT seeded", { responses: responses.length, answers: answerInserts.length });
}

async function seedBurnout(supabaseAdmin: any, companyId: string, userId: string, respondents: any[]) {
  logStep("Seeding Burnout");
  const { data: assessment, error } = await supabaseAdmin
    .from("burnout_assessments")
    .insert({ company_id: companyId, title: "Avaliação Burnout Demo", description: "Avaliação demonstrativa com dados simulados", is_active: true, created_by: userId })
    .select().single();
  if (error) { logStep("Error creating Burnout assessment", error); return; }

  const deptInserts = DEPARTMENTS.map((name, i) => ({ assessment_id: assessment.id, name, employee_count: 10, order_index: i }));
  await supabaseAdmin.from("burnout_departments").insert(deptInserts);

  const responseInserts = respondents.map(r => {
    let total = 0;
    for (let q = 1; q <= 20; q++) total += variedValue(1, 6, 1 - r.bias, r.seed * 20 + q);
    const riskLevel = total <= 40 ? "baixo" : total <= 60 ? "moderado" : total <= 80 ? "alto" : "critico";
    return { assessment_id: assessment.id, department: r.department, respondent_token: r.token, completed_at: new Date().toISOString(), total_score: total, risk_level: riskLevel };
  });
  const { data: responses, error: respError } = await supabaseAdmin.from("burnout_responses").insert(responseInserts).select("id");
  if (respError) { logStep("Error creating Burnout responses", respError); return; }

  const answerInserts: any[] = [];
  responses.forEach((resp: any, ri: number) => {
    const r = respondents[ri];
    for (let q = 1; q <= 20; q++) answerInserts.push({ response_id: resp.id, question_number: q, answer_value: variedValue(1, 6, 1 - r.bias, r.seed * 20 + q) });
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
    .insert({ company_id: companyId, title: "Pesquisa de Clima Demo", description: "Pesquisa demonstrativa com dados simulados", is_active: true })
    .select().single();
  if (error) { logStep("Error creating Climate Survey", error); return; }

  const deptInserts = DEPARTMENTS.map((name, i) => ({ survey_id: survey.id, name, employee_count: 10, order_index: i }));
  await supabaseAdmin.from("survey_departments").insert(deptInserts);

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
    ...likertQuestions.map((q, i) => ({ survey_id: survey.id, question_text: q.text, question_type: "likert" as const, category: q.category, order_index: i, is_required: true })),
    ...openQuestions.map((q, i) => ({ survey_id: survey.id, question_text: q.text, question_type: "open_text" as const, category: q.category, order_index: likertQuestions.length + i, is_required: false })),
  ];
  const { data: questions, error: qError } = await supabaseAdmin.from("survey_questions").insert(questionInserts).select("id, question_type, order_index");
  if (qError) { logStep("Error creating survey questions", qError); return; }

  const responseInserts = respondents.map(r => ({ survey_id: survey.id, department: r.department, respondent_token: r.token, completed_at: new Date().toISOString() }));
  const { data: responses, error: respError } = await supabaseAdmin.from("survey_responses").insert(responseInserts).select("id");
  if (respError) { logStep("Error creating survey responses", respError); return; }

  const answerInserts: any[] = [];
  const sortedQuestions = questions.sort((a: any, b: any) => a.order_index - b.order_index);
  const likertQIds = sortedQuestions.filter((q: any) => q.question_type === "likert");
  const openQIds = sortedQuestions.filter((q: any) => q.question_type === "open_text");

  responses.forEach((resp: any, ri: number) => {
    const r = respondents[ri];
    const respondentIdx = ri % 6;
    likertQIds.forEach((q: any, qi: number) => {
      answerInserts.push({ response_id: resp.id, question_id: q.id, answer_value: String(variedValue(1, 5, r.bias, r.seed * 17 + qi)) });
    });
    openQIds.forEach((q: any, qi: number) => {
      const answers = OPEN_ANSWERS[qi] || OPEN_ANSWERS[0];
      answerInserts.push({ response_id: resp.id, question_id: q.id, answer_text: answers[respondentIdx % answers.length] });
    });
  });

  for (let i = 0; i < answerInserts.length; i += 500) {
    await supabaseAdmin.from("survey_answers").insert(answerInserts.slice(i, i + 500));
  }
  logStep("Climate Survey seeded", { responses: responses.length, answers: answerInserts.length });
}

const DEMO_REPORTS = [
  { title: "Assédio moral por parte de gestor", description: "Venho relatar situações recorrentes de humilhação e constrangimento por parte do meu gestor direto.", category: "assedio_moral", department: "Operacional", urgency: "high", is_anonymous: true, status: "pending" },
  { title: "Discriminação por gênero no setor comercial", description: "Mulheres do setor comercial são sistematicamente preteridas em promoções e oportunidades de liderança.", category: "discriminacao", department: "Comercial", urgency: "high", is_anonymous: true, status: "in_progress" },
  { title: "Condições inseguras no galpão de produção", description: "O galpão de produção apresenta vazamentos no telhado que deixam o piso escorregadio.", category: "seguranca", department: "Operacional", urgency: "critical", is_anonymous: false, reporter_name: "Carlos Mendes", reporter_email: "carlos.mendes@exemplo.com", status: "in_progress" },
  { title: "Desvio de materiais do almoxarifado", description: "Materiais como ferramentas e insumos estão desaparecendo do almoxarifado com frequência.", category: "fraude", department: "Operacional", urgency: "medium", is_anonymous: true, status: "pending" },
  { title: "Assédio sexual no ambiente de trabalho", description: "Uma colega do setor administrativo tem recebido mensagens de cunho sexual de um supervisor.", category: "assedio_sexual", department: "Administrativo", urgency: "critical", is_anonymous: true, status: "resolved" },
  { title: "Sobrecarga de trabalho e horas extras não pagas", description: "Há meses sou obrigado(a) a fazer horas extras que não são registradas no ponto.", category: "trabalho_irregular", department: "TI", urgency: "medium", is_anonymous: true, status: "pending" },
  { title: "Conflito entre equipes e clima hostil", description: "O clima no setor de RH está insustentável com disputas constantes entre dois grupos.", category: "clima_organizacional", department: "RH", urgency: "low", is_anonymous: false, reporter_name: "Ana Paula Silva", reporter_email: "ana.silva@exemplo.com", status: "in_progress" },
  { title: "Uso de substâncias no horário de trabalho", description: "Um funcionário do setor operacional tem demonstrado sinais de uso de álcool durante o expediente.", category: "conduta_inadequada", department: "Operacional", urgency: "high", is_anonymous: true, status: "pending" },
  { title: "Favorecimento em processos seletivos internos", description: "As últimas três vagas internas foram preenchidas por indicações pessoais do gerente.", category: "etica", department: "Comercial", urgency: "low", is_anonymous: true, status: "resolved" },
  { title: "Vazamento de dados pessoais de funcionários", description: "Uma planilha contendo dados pessoais de todos os funcionários está sendo compartilhada abertamente.", category: "seguranca_informacao", department: "TI", urgency: "critical", is_anonymous: false, reporter_name: "Ricardo Oliveira", reporter_email: "ricardo.oliveira@exemplo.com", status: "in_progress" },
];

async function seedCOPSOQ(supabaseAdmin: any, companyId: string, userId: string, respondents: any[]) {
  logStep("Seeding COPSOQ");
  const { data: assessment, error } = await supabaseAdmin
    .from("copsoq_assessments")
    .insert({ company_id: companyId, title: "Avaliação COPSOQ II Demo", description: "Avaliação demonstrativa com dados simulados", is_active: true, created_by: userId })
    .select().single();
  if (error) { logStep("Error creating COPSOQ assessment", error); return; }

  const deptInserts = DEPARTMENTS.map((name, i) => ({ assessment_id: assessment.id, name, employee_count: 10, order_index: i }));
  await supabaseAdmin.from("copsoq_departments").insert(deptInserts);

  const responseInserts = respondents.map(r => ({ assessment_id: assessment.id, department: r.department, respondent_token: r.token, completed_at: new Date().toISOString() }));
  const { data: responses, error: respError } = await supabaseAdmin.from("copsoq_responses").insert(responseInserts).select("id");
  if (respError) { logStep("Error creating COPSOQ responses", respError); return; }

  const answerInserts: any[] = [];
  responses.forEach((resp: any, ri: number) => {
    const r = respondents[ri];
    for (let q = 1; q <= 41; q++) {
      answerInserts.push({ response_id: resp.id, question_number: q, answer_value: variedValue(1, 5, r.bias, r.seed * 41 + q) });
    }
  });
  for (let i = 0; i < answerInserts.length; i += 500) {
    await supabaseAdmin.from("copsoq_answers").insert(answerInserts.slice(i, i + 500));
  }
  logStep("COPSOQ seeded", { responses: responses.length, answers: answerInserts.length });
}

async function seedReports(supabaseAdmin: any, companyId: string) {
  logStep("Seeding Reports");
  const now = new Date();
  const reportInserts = DEMO_REPORTS.map((r, i) => {
    const createdAt = new Date(now.getTime() - (i * 2 + 1) * 24 * 60 * 60 * 1000);
    return { company_id: companyId, title: r.title, description: r.description, category: r.category, department: r.department, urgency: r.urgency, is_anonymous: r.is_anonymous, reporter_name: (r as any).reporter_name || null, reporter_email: (r as any).reporter_email || null, status: r.status, created_at: createdAt.toISOString(), updated_at: createdAt.toISOString() };
  });

  const { data: reports, error } = await supabaseAdmin.from("reports").insert(reportInserts).select("id, status, created_at");
  if (error) { logStep("Error seeding reports", error); return; }

  const updateInserts: any[] = [];
  reports.forEach((report: any, idx: number) => {
    const matchingDemo = DEMO_REPORTS[idx];
    if (matchingDemo && matchingDemo.status !== "pending") {
      updateInserts.push({
        report_id: report.id, old_status: "pending", new_status: matchingDemo.status,
        notes: matchingDemo.status === "in_progress" ? "Denúncia recebida e encaminhada para investigação interna." : "Caso investigado e medidas corretivas aplicadas.",
        created_at: new Date(new Date(report.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  });
  if (updateInserts.length > 0) await supabaseAdmin.from("report_updates").insert(updateInserts);
  logStep("Reports seeded", { count: reports.length });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify user is sales or admin
    const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).single();
    if (!roleData || (roleData.role !== "sales" && roleData.role !== "admin")) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if user already has a demo company
    const { data: profile } = await supabaseAdmin.from("profiles").select("company_id").eq("id", user.id).single();
    if (profile?.company_id) {
      return new Response(JSON.stringify({ success: true, company_id: profile.company_id, message: "Conta demo já existe." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    logStep("Creating demo company for sales user", { userId: user.id });

    // Create demo company
    const slug = `demo-vendas-${Date.now().toString(36)}`;
    const { data: demoCompany, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: "Empresa Demo - Time de Vendas",
        slug,
        email: user.email || "demo-vendas@soia.app.br",
        max_employees: 50,
        subscription_status: "active",
      })
      .select()
      .single();

    if (companyError) {
      logStep("Error creating demo company", companyError);
      throw new Error(`Erro ao criar empresa demo: ${companyError.message}`);
    }

    const companyId = demoCompany.id;
    logStep("Demo company created", { companyId });

    // Link company to sales user profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ company_id: companyId })
      .eq("id", user.id);

    if (profileError) logStep("Error updating profile", profileError);

    // Generate respondent data
    const respondents = DEPARTMENTS.flatMap((dept, di) =>
      Array.from({ length: 6 }, (_, i) => ({
        department: dept,
        token: crypto.randomUUID(),
        seed: di * 100 + i,
        bias: DEPT_BIAS[dept],
      }))
    );

    // Seed all data in parallel
    await Promise.all([
      seedHSEIT(supabaseAdmin, companyId, user.id, respondents),
      seedBurnout(supabaseAdmin, companyId, user.id, respondents),
      seedClimateSurvey(supabaseAdmin, companyId, respondents),
      seedCOPSOQ(supabaseAdmin, companyId, user.id, respondents),
      seedReports(supabaseAdmin, companyId),
    ]);

    logStep("All demo data seeded successfully");

    return new Response(
      JSON.stringify({ success: true, company_id: companyId, message: "Conta demo criada com sucesso!" }),
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
