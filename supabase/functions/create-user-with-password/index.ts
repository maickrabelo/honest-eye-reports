import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'company' | 'sst';
  company_id?: string;
  sst_manager_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, full_name, role, company_id, sst_manager_id }: CreateUserRequest = await req.json();

    // Validar dados
    if (!email || !password || !full_name || !role) {
      throw new Error("Email, senha, nome e papel são obrigatórios");
    }

    if (role === 'company' && !company_id) {
      throw new Error("company_id é obrigatório para usuários do tipo 'company'");
    }

    if (role === 'sst' && !sst_manager_id) {
      throw new Error("sst_manager_id é obrigatório para usuários do tipo 'sst'");
    }

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Usuário não foi criado");

    // Atualizar profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name,
        company_id: role === 'company' ? company_id : null,
        sst_manager_id: role === 'sst' ? sst_manager_id : null,
      })
      .eq("id", authData.user.id);

    if (profileError) throw profileError;

    // Atualizar role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role })
      .eq("user_id", authData.user.id);

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({
        success: true,
        user: authData.user,
        message: "Usuário criado com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
