import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailShell, ctaButton, itemsTable, sendEmail } from "../_shared/operatorEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    .slice(0, 60) || `parceiro-${Date.now().toString(36)}`;

const randomPassword = () =>
  `Soia${Math.random().toString(36).slice(2, 10)}${Math.floor(Math.random() * 90 + 10)}!`;

const SITE_URL = "https://soia.app.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const companyName = String(body.company_name ?? "").trim();
    const employeeCount = String(body.employee_count ?? "").trim();
    const message = String(body.message ?? "").trim();
    const origin = String(body.origin ?? "").trim() || SITE_URL;

    if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.length < 8) {
      return json({ error: "Preencha nome, e-mail válido e telefone." }, 400);
    }

    // 1. Lead sempre registrado (CRM)
    await supabase.from("demo_leads").insert({
      name,
      email,
      phone,
      company_name: companyName || null,
      employee_count: employeeCount || null,
      message: message || null,
      source: "pdparceiros",
    });

    // 2. Já existe conta com esse e-mail?
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = (list?.users ?? []).find((u: any) => u.email?.toLowerCase() === email);

    const { data: existingOperator } = await supabase
      .from("licensed_operators")
      .select("id, user_id")
      .eq("email", email)
      .maybeSingle();

    if (existing && !existingOperator) {
      // conta SOIA já existente com outro papel — não duplicar, time comercial cuida
      return json({
        ok: true,
        accountCreated: false,
        reason: "existing_account",
        message: "Já existe uma conta SOIA com este e-mail. Nosso time entrará em contato.",
      });
    }

    let userId = existingOperator?.user_id ?? existing?.id ?? null;
    let operatorId = existingOperator?.id ?? null;

    const displayName = companyName || name;

    if (!operatorId) {
      // gestora interna (marca do parceiro)
      const { data: manager, error: managerErr } = await supabase
        .from("sst_managers")
        .insert({
          name: displayName,
          email,
          phone,
          slug: slugify(`${displayName}-parceiro`),
          max_companies: 100,
          subscription_status: "active",
          is_licensed_operator: true,
        })
        .select("id")
        .single();
      if (managerErr) throw managerErr;

      if (!userId) {
        const { data: created, error: cErr } = await supabase.auth.admin.createUser({
          email,
          password: randomPassword(),
          email_confirm: true,
          user_metadata: { full_name: name },
        });
        if (cErr) throw cErr;
        userId = created.user!.id;
      }

      await supabase.from("profiles").upsert(
        { id: userId, full_name: name, sst_manager_id: manager.id, must_change_password: false },
        { onConflict: "id" },
      );
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("user_roles").insert({ user_id: userId, role: "licensed_operator" });

      const { data: operator, error: opErr } = await supabase
        .from("licensed_operators")
        .insert({
          user_id: userId,
          sst_manager_id: manager.id,
          razao_social: displayName,
          nome_fantasia: displayName,
          email,
          phone,
          commission_rate: 20,
          status: "active",
          notes: `Cadastro automático via /pdparceiros${employeeCount ? ` — carteira: ${employeeCount}` : ""}`,
        })
        .select("id")
        .single();
      if (opErr) throw opErr;
      operatorId = operator.id;
    }

    // 3. Link para criar a senha
    let actionLink = `${origin}/auth`;
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset-password` },
    });
    if (linkData?.properties?.action_link) actionLink = linkData.properties.action_link;

    // 4. E-mail de boas-vindas
    const html = emailShell(`
      <h2 style="margin:0 0 10px;font-size:22px">Parabéns, ${name}! Você foi aprovado como Parceiro Licenciado SOIA 🎉</h2>
      <p style="font-size:15px;line-height:1.6;color:#334155">
        Sua conta de parceiro já está criada. Basta criar sua senha de acesso no botão abaixo
        para entrar no seu painel e começar a cadastrar clientes no Canal de Ouvidoria SOIA.
      </p>
      ${itemsTable([
        ["Parceiro", displayName],
        ["E-mail de acesso", email],
        ["Nível inicial", "Bronze — 20% de comissão"],
      ])}
      ${ctaButton(actionLink, "Criar minha senha e acessar o painel")}
      <p style="font-size:14px;line-height:1.6;color:#475569">
        No seu painel você encontra o documento explicativo do programa, a régua de níveis de
        parceiro (Bronze, Prata e Ouro), os tipos de faturamento e o cadastro de clientes.
      </p>
      <p style="font-size:13px;color:#64748b">
        Se o botão não funcionar, acesse <a href="${origin}/auth" style="color:#0f766e">${origin}/auth</a>
        e use a opção "Esqueci minha senha".
      </p>
    `);

    await sendEmail(email, "SOIA — Você foi aprovado como Parceiro Licenciado! Crie sua senha", html);

    return json({ ok: true, accountCreated: true, operatorId });
  } catch (err) {
    console.error("[pdparceiros-partner-signup]", err);
    return json({ error: (err as Error).message ?? "Erro inesperado." }, 500);
  }
});
