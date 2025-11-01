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

    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Verify the user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Admin access required' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

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

    // Verificar se o usuário já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // Usuário já existe, atualizar senha
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            full_name,
          },
        }
      );

      if (updateError) throw updateError;
      if (!updateData.user) throw new Error("Erro ao atualizar usuário");
      
      userId = updateData.user.id;
    } else {
      // Criar novo usuário
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
      
      userId = authData.user.id;
    }

    // Atualizar profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name,
        company_id: role === 'company' ? company_id : null,
        sst_manager_id: role === 'sst' ? sst_manager_id : null,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // Atualizar ou inserir role
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select()
      .eq("user_id", userId)
      .single();

    if (existingRole) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (roleError) throw roleError;
    } else {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (roleError) throw roleError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: existingUser ? "Senha atualizada com sucesso" : "Usuário criado com sucesso",
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
