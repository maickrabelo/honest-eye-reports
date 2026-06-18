import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userRes } = await supabase.auth.getUser(token);
    const userId = userRes?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const overrideToken: string | undefined = body?.token;

    // Resolve token: explicit override > DB config > env secret
    let hottok = overrideToken;
    if (!hottok) {
      const { data: cfg } = await supabase
        .from('webhook_configs').select('token').eq('provider', 'hotmart').maybeSingle();
      hottok = cfg?.token || Deno.env.get('HOTMART_HOTTOK') || '';
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const webhookUrl = `${supabaseUrl}/functions/v1/hotmart-webhook`;

    const payload = {
      event: 'PING',
      hottok,
      data: { test: true, sent_by: userId, sent_at: new Date().toISOString() },
    };

    const started = Date.now();
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hotmart-hottok': hottok },
      body: JSON.stringify(payload),
    });
    const responseBody = await resp.text();
    const durationMs = Date.now() - started;

    return new Response(JSON.stringify({
      ok: resp.ok,
      status: resp.status,
      duration_ms: durationMs,
      url: webhookUrl,
      response: tryJson(responseBody),
      token_used_preview: hottok ? `${hottok.slice(0, 4)}…${hottok.slice(-4)} (${hottok.length} chars)` : '(vazio)',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function tryJson(s: string) { try { return JSON.parse(s); } catch { return s; } }
