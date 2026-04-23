import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const EMAIL = "ellen.nascimento@innova.pro.br";
    const PASSWORD = "Ellen@2026!";
    const FULL_NAME = "Ellen Nascimento";

    // Listar usuários (paginado se preciso)
    let driane: any = null;
    let ellen: any = null;
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      for (const u of data.users) {
        if (u.email?.toLowerCase() === "driane@innova.pro.br") driane = u;
        if (u.email?.toLowerCase() === EMAIL) ellen = u;
      }
      if (data.users.length < 200) break;
      page++;
      if (page > 50) break;
    }

    if (!driane) return new Response(JSON.stringify({ error: "Driane não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: drianeProfile } = await admin.from("profiles").select("sst_manager_id").eq("id", driane.id).maybeSingle();
    const sstManagerId = drianeProfile?.sst_manager_id;
    if (!sstManagerId) return new Response(JSON.stringify({ error: "Driane sem sst_manager_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let ellenId: string;
    if (ellen) {
      const { data: upd, error: uErr } = await admin.auth.admin.updateUserById(ellen.id, {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: FULL_NAME },
      });
      if (uErr) throw uErr;
      ellenId = upd.user!.id;
    } else {
      const { data: cre, error: cErr } = await admin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: FULL_NAME },
      });
      if (cErr) throw cErr;
      ellenId = cre.user!.id;
    }

    await admin.from("profiles").update({
      full_name: FULL_NAME,
      sst_manager_id: sstManagerId,
      must_change_password: true,
    }).eq("id", ellenId);

    await admin.from("user_roles").delete().eq("user_id", ellenId);
    await admin.from("user_roles").insert({ user_id: ellenId, role: "sst" });

    await admin.from("user_sst_managers").delete().eq("user_id", ellenId).eq("sst_manager_id", sstManagerId);
    await admin.from("user_sst_managers").insert({ user_id: ellenId, sst_manager_id: sstManagerId, is_default: false });

    return new Response(JSON.stringify({
      success: true,
      ellen_id: ellenId,
      sst_manager_id: sstManagerId,
      email: EMAIL,
      password: PASSWORD,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || "erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
