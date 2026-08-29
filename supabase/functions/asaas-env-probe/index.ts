import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const key = Deno.env.get('ASAAS_API_KEY') ?? '';
  const env = Deno.env.get('ASAAS_ENV') ?? '(unset)';

  const test = async (base: string) => {
    try {
      const r = await fetch(`${base}/customers?limit=1`, {
        headers: { access_token: key, 'Content-Type': 'application/json' },
      });
      const t = await r.text();
      return { status: r.status, ok: r.ok, body: t.slice(0, 200) };
    } catch (e) {
      return { status: 0, ok: false, body: String(e) };
    }
  };

  const result = {
    ASAAS_ENV: env,
    keyLength: key.length,
    keyPrefix: key.slice(0, 12),
    production: await test('https://api.asaas.com/v3'),
    sandbox: await test('https://sandbox.asaas.com/api/v3'),
  };

  return new Response(JSON.stringify(result, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
