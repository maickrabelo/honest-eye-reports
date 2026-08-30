import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calculateOperatorPrice } from "../_shared/operatorPricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const OPERATOR = {
  razaoSocial: "VIGIA COMPLIANCE LTDA (DEMO)",
  nomeFantasia: "Vigia Compliance",
  cnpj: "31555888000199",
  email: "parceiro.licenciado@soia.app",
  phone: "(11) 98888-1212",
  endereco: "Av. Paulista, 1000 - Bela Vista, São Paulo/SP",
  logoUrl: "/lovable-uploads/6b11d97d-f2fc-4542-9a48-b1b401e744b0.png",
  commissionRate: 25,
  password: "Teste123!",
};

type Demo = {
  name: string;
  cnpj: string;
  email: string;
  employees: number;
  plan: "ouvidoria" | "ouvidoria-smart";
  cycle: "monthly" | "annual";
  mode: "direct" | "operator";
  status: "paid" | "overdue" | "pending";
  reports: number;
};

const COMPANIES: Demo[] = [
  { name: "Alfa Metalúrgica Demo LTDA", cnpj: "21000111000101", email: "demo.alfa@parceirodemo.soia.app", employees: 38, plan: "ouvidoria", cycle: "monthly", mode: "direct", status: "paid", reports: 5 },
  { name: "Beta Alimentos Demo LTDA", cnpj: "21000111000202", email: "demo.beta@parceirodemo.soia.app", employees: 120, plan: "ouvidoria", cycle: "monthly", mode: "direct", status: "overdue", reports: 3 },
  { name: "Gama Transportes Demo LTDA", cnpj: "21000111000303", email: "demo.gama@parceirodemo.soia.app", employees: 44, plan: "ouvidoria-smart", cycle: "monthly", mode: "direct", status: "paid", reports: 4 },
  { name: "Delta Construções Demo LTDA", cnpj: "21000111000404", email: "demo.delta@parceirodemo.soia.app", employees: 85, plan: "ouvidoria", cycle: "annual", mode: "direct", status: "paid", reports: 0 },
  { name: "Epsilon Serviços Demo LTDA", cnpj: "21000111000505", email: "demo.epsilon@parceirodemo.soia.app", employees: 60, plan: "ouvidoria-smart", cycle: "monthly", mode: "operator", status: "paid", reports: 6 },
  { name: "Zeta Logística Demo LTDA", cnpj: "21000111000606", email: "demo.zeta@parceirodemo.soia.app", employees: 47, plan: "ouvidoria", cycle: "monthly", mode: "operator", status: "paid", reports: 3 },
  { name: "Eta Saúde Demo LTDA", cnpj: "21000111000707", email: "demo.eta@parceirodemo.soia.app", employees: 210, plan: "ouvidoria", cycle: "monthly", mode: "operator", status: "pending", reports: 0 },
  { name: "Theta Educação Demo LTDA", cnpj: "21000111000808", email: "demo.theta@parceirodemo.soia.app", employees: 30, plan: "ouvidoria-smart", cycle: "annual", mode: "operator", status: "paid", reports: 4 },
];

const REPORT_SEEDS = [
  { title: "Comentários ofensivos na equipe de produção", category: "Assédio Moral", urgency: "high", status: "in_progress", description: "Relato de comentários humilhantes feitos por liderança direta durante reuniões de turno." },
  { title: "Cobrança de metas fora do horário", category: "Condições de Trabalho", urgency: "medium", status: "pending", description: "Mensagens de cobrança enviadas de madrugada e nos fins de semana." },
  { title: "Suspeita de desvio de materiais", category: "Fraude", urgency: "high", status: "pending", description: "Saída de materiais do estoque sem registro no sistema." },
  { title: "Falta de EPI no setor de expedição", category: "Segurança do Trabalho", urgency: "high", status: "resolved", description: "Colaboradores atuando sem luvas e protetor auricular adequados." },
  { title: "Piadas discriminatórias no vestiário", category: "Discriminação", urgency: "medium", status: "in_progress", description: "Comentários repetidos de cunho discriminatório entre colegas." },
  { title: "Sobrecarga de jornada no administrativo", category: "Condições de Trabalho", urgency: "low", status: "resolved", description: "Horas extras habituais sem compensação registrada." },
];

const slugify = (name: string) =>
  String(name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `demo-${Date.now().toString(36)}`;

const iso = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Não autenticado." }, 401);
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) return json({ error: "Sessão inválida." }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Acesso restrito a administradores." }, 403);

    // ---------- limpeza idempotente ----------
    const { data: prevOperator } = await supabase
      .from("licensed_operators")
      .select("id, sst_manager_id, user_id")
      .eq("email", OPERATOR.email)
      .maybeSingle();

    if (prevOperator) {
      const { data: links } = await supabase
        .from("licensed_operator_companies")
        .select("company_id")
        .eq("operator_id", prevOperator.id);
      const companyIds = (links ?? []).map((l: any) => l.company_id);
      if (companyIds.length) {
        await supabase.from("companies").delete().in("id", companyIds);
      }
      await supabase.from("licensed_operator_invoices").delete().eq("operator_id", prevOperator.id);
      await supabase.from("licensed_operators").delete().eq("id", prevOperator.id);
      if (prevOperator.sst_manager_id) {
        await supabase.from("sst_managers").delete().eq("id", prevOperator.sst_manager_id);
      }
    }
    await supabase.from("companies").delete().in("cnpj", COMPANIES.map((c) => c.cnpj));

    // ---------- gestora interna (marca do parceiro) ----------
    const { data: manager, error: managerErr } = await supabase
      .from("sst_managers")
      .insert({
        name: OPERATOR.razaoSocial,
        cnpj: OPERATOR.cnpj,
        email: OPERATOR.email,
        phone: OPERATOR.phone,
        address: OPERATOR.endereco,
        logo_url: OPERATOR.logoUrl,
        slug: slugify(`${OPERATOR.nomeFantasia}-demo`),
        max_companies: 100,
        subscription_status: "active",
        is_licensed_operator: true,
      })
      .select("id")
      .single();
    if (managerErr) throw managerErr;

    // ---------- usuário do parceiro ----------
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const allUsers = list?.users ?? [];
    let operatorUser = allUsers.find((u: any) => u.email?.toLowerCase() === OPERATOR.email);
    if (operatorUser) {
      await supabase.auth.admin.updateUserById(operatorUser.id, {
        password: OPERATOR.password,
        email_confirm: true,
      });
    } else {
      const { data: created, error: cErr } = await supabase.auth.admin.createUser({
        email: OPERATOR.email,
        password: OPERATOR.password,
        email_confirm: true,
        user_metadata: { full_name: OPERATOR.nomeFantasia },
      });
      if (cErr) throw cErr;
      operatorUser = created.user!;
    }
    const operatorUserId = operatorUser!.id;

    await supabase.from("profiles").upsert(
      {
        id: operatorUserId,
        full_name: `${OPERATOR.nomeFantasia} (Demo)`,
        sst_manager_id: manager.id,
        must_change_password: false,
      },
      { onConflict: "id" },
    );
    await supabase.from("user_roles").delete().eq("user_id", operatorUserId);
    await supabase.from("user_roles").insert({ user_id: operatorUserId, role: "licensed_operator" });

    const { data: operator, error: opErr } = await supabase
      .from("licensed_operators")
      .insert({
        user_id: operatorUserId,
        sst_manager_id: manager.id,
        razao_social: OPERATOR.razaoSocial,
        nome_fantasia: OPERATOR.nomeFantasia,
        cnpj: OPERATOR.cnpj,
        email: OPERATOR.email,
        phone: OPERATOR.phone,
        endereco_completo: OPERATOR.endereco,
        logo_url: OPERATOR.logoUrl,
        commission_rate: OPERATOR.commissionRate,
        status: "active",
        notes: "Conta demo para testes do fluxo de parceiro licenciado.",
      })
      .select("*")
      .single();
    if (opErr) throw opErr;

    // ---------- planos ----------
    const { data: plans } = await supabase
      .from("subscription_plans")
      .select("id, slug")
      .in("slug", ["ouvidoria", "ouvidoria-smart"]);
    const planId: Record<string, string> = {};
    (plans ?? []).forEach((p: any) => { planId[p.slug] = p.id; });

    const now = new Date();
    const created: any[] = [];

    for (let i = 0; i < COMPANIES.length; i++) {
      const c = COMPANIES[i];
      const price = calculateOperatorPrice(c.plan, c.employees, c.cycle);
      const grantAccess = c.mode === "operator" || c.status === "paid";

      const dueDate = new Date(now);
      if (c.status === "overdue") dueDate.setDate(now.getDate() - 9);
      else dueDate.setDate(now.getDate() + 5 + i);

      const { data: company, error: compErr } = await supabase
        .from("companies")
        .insert({
          name: c.name,
          cnpj: c.cnpj,
          email: c.email,
          phone: "(11) 3000-00" + String(10 + i),
          slug: slugify(c.name),
          employee_count: c.employees,
          max_employees: c.employees,
          subscription_status: grantAccess ? "active" : "pending",
        })
        .select("id")
        .single();
      if (compErr) throw compErr;

      await supabase
        .from("company_sst_assignments")
        .insert({ company_id: company.id, sst_manager_id: manager.id });

      await supabase.from("company_feature_access").upsert(
        {
          company_id: company.id,
          ouvidoria_enabled: true,
          psicossocial_enabled: false,
          burnout_enabled: false,
          clima_enabled: false,
          treinamentos_enabled: false,
        },
        { onConflict: "company_id" },
      );

      const { data: subscription } = await supabase
        .from("subscriptions")
        .insert({
          owner_email: c.email,
          plan_id: planId[c.plan],
          billing_cycle: c.cycle === "annual" ? "annual" : "monthly",
          status: grantAccess ? "active" : "pending",
          amount_cents: price.monthlyCents,
          provider: "asaas",
          metadata: {
            licensedOperatorId: operator.id,
            licensedOperatorName: operator.razao_social,
            billingMode: c.mode,
            employeeCount: c.employees,
            companyName: c.name,
            demo: true,
          },
        })
        .select("id")
        .maybeSingle();
      if (subscription) {
        await supabase.from("companies").update({ parent_subscription_id: subscription.id }).eq("id", company.id);
      }

      // usuário de acesso da empresa
      const companyPassword = c.cnpj;
      let companyUser = allUsers.find((u: any) => u.email?.toLowerCase() === c.email);
      if (companyUser) {
        await supabase.auth.admin.updateUserById(companyUser.id, {
          password: companyPassword,
          email_confirm: true,
        });
      } else {
        const { data: cu, error: cuErr } = await supabase.auth.admin.createUser({
          email: c.email,
          password: companyPassword,
          email_confirm: true,
          user_metadata: { full_name: c.name },
        });
        if (cuErr) throw cuErr;
        companyUser = cu.user!;
      }
      await supabase.from("profiles").upsert(
        { id: companyUser!.id, full_name: c.name, company_id: company.id, must_change_password: false },
        { onConflict: "id" },
      );
      await supabase.from("user_roles").delete().eq("user_id", companyUser!.id);
      await supabase.from("user_roles").insert({ user_id: companyUser!.id, role: "company" });
      await supabase
        .from("user_companies")
        .upsert(
          { user_id: companyUser!.id, company_id: company.id, is_default: true },
          { onConflict: "user_id,company_id" },
        );

      await supabase.from("licensed_operator_companies").insert({
        operator_id: operator.id,
        company_id: company.id,
        plan_slug: c.plan,
        employee_count: c.employees,
        billing_cycle: c.cycle,
        billing_mode: c.mode,
        monthly_amount_cents: price.monthlyCents,
        charge_amount_cents: c.mode === "direct" ? price.totalChargeCents : price.monthlyCents,
        payment_status: c.status,
        asaas_customer_id: c.mode === "direct" ? `demo_cus_${i + 1}` : null,
        asaas_payment_id: c.mode === "direct" ? `demo_pay_${i + 1}` : null,
        invoice_url: c.mode === "direct" ? "https://www.asaas.com/demo-cobranca" : null,
        next_due_date: iso(dueDate),
        last_paid_at: c.status === "paid" ? new Date(now.getTime() - 86400000 * (3 + i)).toISOString() : null,
        active: true,
      });

      // denúncias demo
      for (let r = 0; r < c.reports; r++) {
        const seed = REPORT_SEEDS[(i + r) % REPORT_SEEDS.length];
        await supabase.from("reports").insert({
          company_id: company.id,
          title: seed.title,
          description: seed.description,
          category: seed.category,
          department: ["Produção", "Administrativo", "Logística", "Comercial"][(i + r) % 4],
          status: seed.status,
          urgency: seed.urgency,
          is_anonymous: r % 2 === 0,
          reporter_name: r % 2 === 0 ? null : "Colaborador Demo",
          reporter_email: r % 2 === 0 ? null : c.email,
          created_at: new Date(now.getTime() - 86400000 * (2 + r * 4 + i)).toISOString(),
        });
      }

      created.push({
        company: c.name,
        email: c.email,
        password: companyPassword,
        plan: c.plan,
        cycle: c.cycle,
        mode: c.mode,
        monthlyCents: price.monthlyCents,
        status: c.status,
      });
    }

    // ---------- faturas / encontro de contas ----------
    const rate = OPERATOR.commissionRate / 100;
    const operatorCompanies = COMPANIES.map((c, i) => ({
      ...c,
      monthlyCents: calculateOperatorPrice(c.plan, c.employees, c.cycle).monthlyCents,
      index: i,
    }));

    const buildInvoice = async (monthOffset: number, status: "paid" | "pending") => {
      const ref = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const periodStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const periodEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      const referenceMonth = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;

      const billed = operatorCompanies.filter((c) => c.mode === "operator");
      const gross = billed.reduce((s, c) => s + c.monthlyCents, 0);
      const discount = Math.round(gross * rate);
      const creditBase = operatorCompanies
        .filter((c) => c.mode === "direct" && c.status === "paid")
        .reduce((s, c) => s + c.monthlyCents, 0);
      const credit = Math.round(creditBase * rate);
      const total = gross - discount - credit;

      const { data: invoice, error: invErr } = await supabase
        .from("licensed_operator_invoices")
        .insert({
          operator_id: operator.id,
          reference_month: referenceMonth,
          period_start: iso(periodStart),
          period_end: iso(periodEnd),
          gross_cents: gross,
          discount_cents: discount,
          commission_credit_cents: credit,
          total_cents: total,
          status: total <= 0 ? "credit" : status,
          asaas_payment_id: status === "paid" ? `demo_inv_${referenceMonth}` : null,
          invoice_url: total > 0 ? "https://www.asaas.com/demo-fatura" : null,
          closed_at: new Date(ref.getFullYear(), ref.getMonth(), 20, 12).toISOString(),
          paid_at: status === "paid" && total > 0
            ? new Date(ref.getFullYear(), ref.getMonth(), 24, 12).toISOString()
            : null,
        })
        .select("id")
        .single();
      if (invErr) throw invErr;

      const items = [
        ...billed.map((c) => ({
          invoice_id: invoice.id,
          company_name: c.name,
          kind: "charge",
          description: `Mensalidade ${c.plan === "ouvidoria" ? "Ouvidoria" : "Ouvidoria Smart"} — ${c.employees} colaboradores`,
          plan_slug: c.plan,
          employee_count: c.employees,
          amount_cents: c.monthlyCents,
        })),
        {
          invoice_id: invoice.id,
          company_name: null,
          kind: "discount",
          description: `Desconto de comissão (${OPERATOR.commissionRate}%) sobre empresas faturadas ao licenciado`,
          plan_slug: null,
          employee_count: null,
          amount_cents: -discount,
        },
        ...operatorCompanies
          .filter((c) => c.mode === "direct" && c.status === "paid")
          .map((c) => ({
            invoice_id: invoice.id,
            company_name: c.name,
            kind: "commission",
            description: `Comissão ${OPERATOR.commissionRate}% — faturamento direto pago`,
            plan_slug: c.plan,
            employee_count: c.employees,
            amount_cents: -Math.round(c.monthlyCents * rate),
          })),
      ];
      await supabase.from("licensed_operator_invoice_items").insert(items);
      return { referenceMonth, gross, discount, credit, total };
    };

    const closedInvoice = await buildInvoice(1, "paid");
    const openInvoice = await buildInvoice(0, "pending");

    return json({
      success: true,
      operator: {
        email: OPERATOR.email,
        password: OPERATOR.password,
        commissionRate: OPERATOR.commissionRate,
        dashboard: "/parceiro-licenciado",
      },
      companies: created,
      invoices: { closedInvoice, openInvoice },
    });
  } catch (err) {
    console.error("[SEED-LICENSED-OPERATOR-DEMO]", err);
    return json({ error: (err as Error).message ?? "Erro inesperado" }, 500);
  }
});
