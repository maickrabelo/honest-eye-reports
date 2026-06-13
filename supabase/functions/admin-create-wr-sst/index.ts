import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sstManagerId = "94b3132e-3599-40b3-ab09-e5a37ee04e96";
  const email = "robert@wrseg.com.br";
  const fullName = "Robert";
  const newName = "WR - MEDICINA E SEGURANCA DO TRABALHO LTDA - ME";
  const password = "66201161000151";

  // 1. Update sst_manager
  const { error: updErr } = await supabase
    .from("sst_managers")
    .update({
      name: newName,
      email,
      max_companies: 30,
      subscription_status: "active",
      trial_ends_at: null,
    })
    .eq("id", sstManagerId);
  if (updErr) return new Response(JSON.stringify({ step: "update_sst", error: updErr.message }), { status: 500, headers: corsHeaders });

  // 2. Check if auth user exists
  let userId: string | null = null;
  for (let page = 1; page < 20; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    const found = data?.users?.find((u: any) => u.email?.toLowerCase() === email);
    if (found) { userId = found.id; break; }
    if (!data?.users?.length || data.users.length < 1000) break;
  }

  if (userId) {
    await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
  } else {
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (cErr) return new Response(JSON.stringify({ step: "create_user", error: cErr.message }), { status: 500, headers: corsHeaders });
    userId = created.user!.id;
  }

  // 3. Upsert profile
  await supabase.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    sst_manager_id: sstManagerId,
    must_change_password: true,
  }, { onConflict: "id" });

  // 4. Set role = sst
  await supabase.from("user_roles").delete().eq("user_id", userId);
  await supabase.from("user_roles").insert({ user_id: userId, role: "sst" });

  return new Response(JSON.stringify({ success: true, sst_manager_id: sstManagerId, user_id: userId, email, password }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
