import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calculateOperatorPrice, brl, OPERATOR_PLAN_LABELS } from "../_shared/operatorPricing.ts";
import { emailShell, itemsTable, ctaButton, sendEmail } from "../_shared/operatorEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE = (Deno.env.get("ASAAS_ENV") ?? "production").trim().toLowerCase() !== "sandbox"
  ? "https://api.asaas.com/v3"
  : "https://sandbox.asaas.com/api/v3";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const slugify = (name: string) =>
  String(name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `empresa-${Date.now().toString(36)}`;

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
    const userId = userData.user.id;

    const body = await req.json();

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = roles?.some((r: any) => r.role === "admin") ?? false;

    let operatorQuery = supabase.from("licensed_operators").select("*");
    operatorQuery = isAdmin && body.operatorId
      ? operatorQuery.eq("id", String(body.operatorId))
      : operatorQuery.eq("user_id", userId);
    const { data: operator } = await operatorQuery.maybeSingle();
    if (!operator) return json({ error: "Parceiro licenciado não encontrado." }, 403);
    if (operator.status !== "active") return json({ error: "Parceiro licenciado inativo." }, 403);

    const name = String(body.name ?? "").trim();
    const cnpjDigits = String(body.cnpj ?? "").replace(/\D/g, "");
    const email = String(body.email ?? "").trim().toLowerCase();
    const employeeCount = Number.parseInt(String(body.employeeCount ?? ""), 10);
    const planSlug = String(body.planSlug ?? "ouvidoria");
    const billingCycle = String(body.billingCycle ?? "monthly");
    const billingMode = String(body.billingMode ?? "direct");

    if (!name) return json({ error: "Nome da empresa obrigatório." }, 400);
    if (!email) return json({ error: "E-mail da empresa obrigatório." }, 400);
    if (cnpjDigits.length < 11) return json({ error: "CNPJ inválido." }, 400);
    if (!Number.isFinite(employeeCount) || employeeCount < 1) {
      return json({ error: "Quantidade de colaboradores inválida." }, 400);
    }
    if (!["ouvidoria", "ouvidoria-smart"].includes(planSlug)) {
      return json({ error: "Plano inválido para parceiro licenciado." }, 400);
    }
    if (!["monthly", "annual"].includes(billingCycle)) return json({ error: "Recorrência inválida." }, 400);
    if (!["direct", "operator"].includes(billingMode)) return json({ error: "Modalidade inválida." }, 400);

    const price = calculateOperatorPrice(planSlug as any, employeeCount, billingCycle as any);

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id, name")
      .eq("slug", planSlug)
      .maybeSingle();
    if (!plan) return json({ error: "Plano não encontrado." }, 400);

    // limite de empresas da gestora interna
    const { count: currentCount } = await supabase
      .from("company_sst_assignments")
      .select("company_id", { count: "exact", head: true })
      .eq("sst_manager_id", operator.sst_manager_id);
    const { data: manager } = await supabase
      .from("sst_managers")
      .select("max_companies, extra_company_slots, name, logo_url")
      .eq("id", operator.sst_manager_id)
      .maybeSingle();
    const limit = (manager?.max_companies ?? 50) + (manager?.extra_company_slots ?? 0);
    if ((currentCount ?? 0) >= limit) {
      return json({ error: `Limite de ${limit} empresas atingido. Fale com a SOIA.` }, 400);
    }

    // empresa existente?
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .in("cnpj", Array.from(new Set([cnpjDigits, String(body.cnpj ?? "").trim()])))
      .maybeSingle();
    if (existing) {
      const { data: alreadyLinked } = await supabase
        .from("licensed_operator_companies")
        .select("id")
        .eq("company_id", existing.id)
        .maybeSingle();
      if (alreadyLinked) return json({ error: "Esta empresa já está cadastrada." }, 400);
    }

    const grantAccessNow = billingMode === "operator";

    // 1. Empresa
    let companyId = existing?.id as string | undefined;
    if (companyId) {
      await supabase
        .from("companies")
        .update({
          name,
          email,
          phone: body.phone ?? null,
          address: body.address ?? null,
          employee_count: employeeCount,
          max_employees: employeeCount,
          subscription_status: grantAccessNow ? "active" : "pending",
        })
        .eq("id", companyId);
    } else {
      const { data: created, error: companyErr } = await supabase
        .from("companies")
        .insert({
          name,
          cnpj: cnpjDigits,
          email,
          phone: body.phone ?? null,
          address: body.address ?? null,
          slug: slugify(name),
          employee_count: employeeCount,
          max_employees: employeeCount,
          subscription_status: grantAccessNow ? "active" : "pending",
        })
        .select("id")
        .single();
      if (companyErr) throw companyErr;
      companyId = created.id;
    }

    // 2. Vínculo com a gestora interna do parceiro
    const { data: link } = await supabase
      .from("company_sst_assignments")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("sst_manager_id", operator.sst_manager_id)
      .maybeSingle();
    if (!link) {
      await supabase
        .from("company_sst_assignments")
        .insert({ company_id: companyId, sst_manager_id: operator.sst_manager_id });
    }

    // 3. Somente Ouvidoria liberada
    await supabase.from("company_feature_access").upsert(
      {
        company_id: companyId,
        ouvidoria_enabled: true,
        psicossocial_enabled: false,
        burnout_enabled: false,
        clima_enabled: false,
        treinamentos_enabled: false,
        updated_by: userId,
      },
      { onConflict: "company_id" },
    );

    // 4. Assinatura interna (define o plano da empresa)
    const { data: subscription } = await supabase
      .from("subscriptions")
      .insert({
        owner_email: email,
        plan_id: plan.id,
        billing_cycle: billingCycle === "annual" ? "annual" : "monthly",
        status: grantAccessNow ? "active" : "pending",
        amount_cents: price.monthlyCents,
        provider: "asaas",
        metadata: {
          licensedOperatorId: operator.id,
          licensedOperatorName: operator.razao_social,
          billingMode,
          employeeCount,
          companyName: name,
        },
      })
      .select("id")
      .single();
    if (subscription) {
      await supabase.from("companies").update({ parent_subscription_id: subscription.id }).eq("id", companyId);
    }

    const partnerLogo = operator.logo_url ?? manager?.logo_url ?? null;
    const planLabel = OPERATOR_PLAN_LABELS[planSlug as "ouvidoria"] ?? plan.name;
    const cycleLabel = billingCycle === "annual" ? "Anual (12x sem juros)" : "Mensal";

    let invoiceUrl: string | null = null;
    let asaasCustomerId: string | null = null;
    let asaasPaymentId: string | null = null;
    let asaasSubscriptionId: string | null = null;
    let tempPassword: string | null = null;

    if (billingMode === "direct") {
      const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
      if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

      // cliente Asaas
      const findRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cnpjDigits}`, {
        headers: { access_token: ASAAS_API_KEY },
      });
      const findJson = await findRes.json();
      if (findJson?.data?.[0]?.id) {
        asaasCustomerId = findJson.data[0].id;
      } else {
        const createRes = await fetch(`${ASAAS_BASE}/customers`, {
          method: "POST",
          headers: { access_token: ASAAS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            cpfCnpj: cnpjDigits,
            mobilePhone: String(body.phone ?? "").replace(/\D/g, "") || undefined,
          }),
        });
        const createJson = await createRes.json();
        if (!createRes.ok) throw new Error(`Asaas customer: ${JSON.stringify(createJson)}`);
        asaasCustomerId = createJson.id;
      }

      const due = new Date();
      due.setDate(due.getDate() + 3);
      const dueDate = due.toISOString().split("T")[0];
      const description = `SOIA - ${planLabel} (${cycleLabel}) - ${name}`;

      if (billingCycle === "annual") {
        const payRes = await fetch(`${ASAAS_BASE}/payments`, {
          method: "POST",
          headers: { access_token: ASAAS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: asaasCustomerId,
            billingType: "CREDIT_CARD",
            dueDate,
            installmentCount: 12,
            totalValue: price.totalChargeCents / 100,
            description: `${description} - 12x sem juros`,
            externalReference: `soia-lop-${operator.id}-${companyId}`,
          }),
        });
        const payJson = await payRes.json();
        if (!payRes.ok) throw new Error(`Asaas payment: ${JSON.stringify(payJson)}`);
        invoiceUrl = payJson?.invoiceUrl ?? null;
        asaasPaymentId = payJson?.id ?? null;
      } else {
        const subRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
          method: "POST",
          headers: { access_token: ASAAS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: asaasCustomerId,
            billingType: "UNDEFINED",
            value: price.monthlyCents / 100,
            nextDueDate: dueDate,
            cycle: "MONTHLY",
            description,
            externalReference: `soia-lop-${operator.id}-${companyId}`,
          }),
        });
        const subJson = await subRes.json();
        if (!subRes.ok) throw new Error(`Asaas subscription: ${JSON.stringify(subJson)}`);
        asaasSubscriptionId = subJson.id;
        const payRes = await fetch(`${ASAAS_BASE}/payments?subscription=${subJson.id}&limit=1`, {
          headers: { access_token: ASAAS_API_KEY },
        });
        const payJson = await payRes.json();
        invoiceUrl = payJson?.data?.[0]?.invoiceUrl ?? null;
        asaasPaymentId = payJson?.data?.[0]?.id ?? null;
      }

      if (subscription) {
        await supabase
          .from("subscriptions")
          .update({
            asaas_customer_id: asaasCustomerId,
            asaas_subscription_id: asaasSubscriptionId,
            asaas_payment_id: asaasPaymentId,
            invoice_url: invoiceUrl,
          })
          .eq("id", subscription.id);
      }

      if (invoiceUrl) {
        await sendEmail(
          email,
          `Sua assinatura SOIA — ${planLabel}`,
          emailShell(
            `<h2 style="margin:0 0 10px;font-size:20px">Olá, ${name}!</h2>
             <p style="font-size:15px;line-height:1.6;color:#334155">
               A <strong>${operator.razao_social}</strong> preparou o seu Canal de Ouvidoria na plataforma SOIA.
               Abaixo estão os detalhes da assinatura. Após a confirmação do pagamento, seu acesso é liberado
               automaticamente e você recebe as credenciais por e-mail.
             </p>
             ${itemsTable([
               ["Plano", planLabel],
               ["Colaboradores", String(employeeCount)],
               ["Recorrência", cycleLabel],
               ["Valor mensal", brl(price.monthlyCents)],
               billingCycle === "annual"
                 ? ["Total anual", `${brl(price.totalChargeCents)} em 12x de ${brl(price.installmentCents)}`]
                 : ["Cobrança", `${brl(price.monthlyCents)}/mês`],
             ] as [string, string][])}
             ${ctaButton(invoiceUrl, "Pagar agora")}
             <p style="font-size:13px;color:#64748b">Qualquer dúvida, fale com a ${operator.razao_social}.</p>`,
            partnerLogo,
          ),
        );
      }
    } else {
      // Faturamento para o licenciado: acesso liberado na hora
      tempPassword = cnpjDigits;
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingAuth = list?.users?.find((u: any) => u.email?.toLowerCase() === email);
      let companyUserId: string;
      if (existingAuth) {
        companyUserId = existingAuth.id;
        tempPassword = null;
      } else {
        const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: name },
        });
        if (createErr) throw createErr;
        companyUserId = createdUser.user!.id;
      }

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("company_id, full_name, must_change_password")
        .eq("id", companyUserId)
        .maybeSingle();
      await supabase.from("profiles").upsert(
        {
          id: companyUserId,
          full_name: currentProfile?.full_name || name,
          company_id: currentProfile?.company_id || companyId,
          must_change_password: currentProfile?.must_change_password ?? true,
        },
        { onConflict: "id" },
      );

      const { data: companyRoles } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", companyUserId)
        .eq("role", "company")
        .limit(1);
      if (!companyRoles?.length) {
        await supabase.from("user_roles").insert({ user_id: companyUserId, role: "company" });
      }
      await supabase.from("user_roles").delete().eq("user_id", companyUserId).eq("role", "pending");

      const { data: companyLinks } = await supabase
        .from("user_companies")
        .select("id")
        .eq("user_id", companyUserId)
        .eq("company_id", companyId)
        .limit(1);
      if (!companyLinks?.length) {
        await supabase.from("user_companies").insert({ user_id: companyUserId, company_id: companyId });
      }

      await sendEmail(
        email,
        `Bem-vindo ao Canal de Ouvidoria SOIA — ${name}`,
        emailShell(
          `<h2 style="margin:0 0 10px;font-size:20px">Seu canal de ouvidoria está ativo!</h2>
           <p style="font-size:15px;line-height:1.6;color:#334155">
             A <strong>${operator.razao_social}</strong> ativou o Canal de Ouvidoria SOIA para a
             <strong>${name}</strong>. Use os dados abaixo para acessar e defina sua nova senha no primeiro login.
           </p>
           ${itemsTable([
             ["Acesso", "https://soia.app.br/auth"],
             ["Usuário", email],
             ...(tempPassword ? ([["Senha provisória", tempPassword]] as [string, string][]) : []),
             ["Plano", planLabel],
           ] as [string, string][])}
           ${ctaButton("https://soia.app.br/auth", "Acessar minha conta")}
           <p style="font-size:13px;color:#64748b">O faturamento deste plano é feito pela ${operator.razao_social}.</p>`,
          partnerLogo,
        ),
      );
    }

    // 5. Registro comercial do parceiro
    const { data: opCompany, error: opCompanyErr } = await supabase
      .from("licensed_operator_companies")
      .insert({
        operator_id: operator.id,
        company_id: companyId,
        plan_slug: planSlug,
        employee_count: employeeCount,
        billing_cycle: billingCycle,
        billing_mode: billingMode,
        monthly_amount_cents: price.monthlyCents,
        charge_amount_cents: price.totalChargeCents,
        payment_status: billingMode === "operator" ? "billed_to_operator" : "pending",
        asaas_customer_id: asaasCustomerId,
        asaas_payment_id: asaasPaymentId,
        asaas_subscription_id: asaasSubscriptionId,
        invoice_url: invoiceUrl,
      })
      .select("*")
      .single();
    if (opCompanyErr) throw opCompanyErr;

    return json({
      success: true,
      company: opCompany,
      invoiceUrl,
      tempPassword,
      pricing: price,
    });
  } catch (err) {
    console.error("[LICENSED-OPERATOR-CREATE-COMPANY]", err);
    return json({ error: (err as Error).message ?? "Erro inesperado" }, 500);
  }
});
