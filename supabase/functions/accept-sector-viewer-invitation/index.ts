import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateRandomPassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();

    if (!token || !password || password.length < 8) {
      return new Response(JSON.stringify({ error: "Token e senha (mínimo 8 caracteres) são obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inv } = await admin
      .from("sector_viewer_invitations").select("*").eq("token", token).maybeSingle();

    if (!inv) {
      return new Response(JSON.stringify({ error: "Convite não encontrado." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (inv.status !== "pending") {
      return new Response(JSON.stringify({ error: "Convite já utilizado ou revogado." }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(inv.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Convite expirado." }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = String(inv.email).toLowerCase();

    // Procurar usuário existente
    let userId: string | null = null;
    {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found) userId = found.id;
    }

    // Criar se não existir
    if (!userId) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password,
        email_confirm: true,
        user_metadata: { full_name: fullName || email },
      });
      if (cErr || !created.user) {
        console.error("create user error", cErr);
        return new Response(JSON.stringify({ error: "Erro ao criar usuário." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
    } else {
      // Atualizar senha do usuário existente (não muda outras roles, é um novo escopo de acesso)
      await admin.auth.admin.updateUserById(userId, { password });
    }

    // Garantir profile
    await admin.from("profiles").upsert({
      id: userId, full_name: fullName || email,
    }, { onConflict: "id" });

    // Remover role pending; adicionar sector_viewer se ainda não tiver
    await admin.from("user_roles").delete().eq("user_id", userId).eq("role", "pending");
    const { data: existingRoles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const hasRole = existingRoles?.some((r: any) => r.role === "sector_viewer");
    if (!hasRole) {
      await admin.from("user_roles").insert({ user_id: userId, role: "sector_viewer" });
    }

    // Inserir os acessos por setor
    const rows = (inv.department_names as string[]).map((dept) => ({
      user_id: userId!, sst_manager_id: inv.sst_manager_id,
      company_id: inv.company_id, assessment_type: inv.assessment_type,
      department_name: dept, granted_by: inv.invited_by,
    }));
    await admin.from("sector_viewer_access").upsert(rows, {
      onConflict: "user_id,company_id,assessment_type,department_name",
    });

    // Marcar convite como aceito
    await admin.from("sector_viewer_invitations").update({
      status: "accepted", accepted_at: new Date().toISOString(), accepted_by: userId,
    }).eq("id", inv.id);

    return new Response(JSON.stringify({ success: true, email }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("unexpected", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
