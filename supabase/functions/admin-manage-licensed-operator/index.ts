import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Não autenticado." }, 401);
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) return json({ error: "Sessão inválida." }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Acesso restrito a administradores." }, 403);

    const body = await req.json();
    const action = String(body.action ?? "create");

    if (action === "update") {
      const operatorId = String(body.operatorId ?? "");
      if (!operatorId) return json({ error: "Parceiro não informado." }, 400);
      const patch: Record<string, unknown> = {};
      if (body.commissionRate != null) patch.commission_rate = Number(body.commissionRate);
      if (body.status) patch.status = String(body.status);
      if (body.logoUrl !== undefined) patch.logo_url = body.logoUrl;
      if (body.notes !== undefined) patch.notes = body.notes;
      if (body.phone !== undefined) patch.phone = body.phone;
      if (body.enderecoCompleto !== undefined) patch.endereco_completo = body.enderecoCompleto;

      const { error } = await supabase.from("licensed_operators").update(patch).eq("id", operatorId);
      if (error) throw error;

      if (body.logoUrl !== undefined) {
        const { data: op } = await supabase
          .from("licensed_operators")
          .select("sst_manager_id")
          .eq("id", operatorId)
          .maybeSingle();
        if (op?.sst_manager_id) {
          await supabase.from("sst_managers").update({ logo_url: body.logoUrl }).eq("id", op.sst_manager_id);
        }
      }
      return json({ success: true });
    }

    // ---- create ----
    const razaoSocial = String(body.razaoSocial ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const cnpj = String(body.cnpj ?? "").replace(/\D/g, "");
    const commissionRate = Number(body.commissionRate ?? 20);
    const maxCompanies = Number(body.maxCompanies ?? 100);

    if (!razaoSocial) return json({ error: "Razão social obrigatória." }, 400);
    if (!email) return json({ error: "E-mail obrigatório." }, 400);
    if (cnpj.length < 11) return json({ error: "CNPJ/CPF inválido." }, 400);

    const { data: existingOp } = await supabase
      .from("licensed_operators")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingOp) return json({ error: "Já existe um parceiro licenciado com este e-mail." }, 400);

    // 1. sst_manager interno (usado para vínculo das empresas e marca)
    const { data: manager, error: managerErr } = await supabase
      .from("sst_managers")
      .insert({
        name: razaoSocial,
        cnpj,
        email,
        phone: body.phone ?? null,
        address: body.enderecoCompleto ?? null,
        logo_url: body.logoUrl ?? null,
        slug: slugify(razaoSocial),
        max_companies: maxCompanies,
        subscription_status: "active",
        is_licensed_operator: true,
      })
      .select("id")
      .single();
    if (managerErr) throw managerErr;

    // 2. usuário
    const tempPassword = cnpj;
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingAuth = list?.users?.find((u: any) => u.email?.toLowerCase() === email);
    let userId: string;
    if (existingAuth) {
      userId = existingAuth.id;
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: razaoSocial },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: razaoSocial,
        sst_manager_id: manager.id,
        must_change_password: true,
      },
      { onConflict: "id" },
    );

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r: any) => r.role === "licensed_operator")) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "licensed_operator" });
    }
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "pending");

    // 3. registro comercial
    const { data: operator, error: opErr } = await supabase
      .from("licensed_operators")
      .insert({
        user_id: userId,
        sst_manager_id: manager.id,
        razao_social: razaoSocial,
        nome_fantasia: body.nomeFantasia ?? null,
        cnpj,
        email,
        phone: body.phone ?? null,
        endereco_completo: body.enderecoCompleto ?? null,
        logo_url: body.logoUrl ?? null,
        commission_rate: commissionRate,
        notes: body.notes ?? null,
      })
      .select("*")
      .single();
    if (opErr) throw opErr;

    return json({
      success: true,
      operator,
      credentials: { email, tempPassword },
    });
  } catch (err) {
    console.error("[ADMIN-MANAGE-LICENSED-OPERATOR]", err);
    return json({ error: (err as Error).message ?? "Erro inesperado" }, 500);
  }
});
