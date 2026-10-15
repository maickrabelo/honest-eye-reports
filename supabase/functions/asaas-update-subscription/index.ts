import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { subscriptionId, nextDueDate } = await req.json()
    if (!subscriptionId || !nextDueDate) {
      return new Response(JSON.stringify({ error: 'subscriptionId e nextDueDate são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('ASAAS_API_KEY')
    if (!apiKey) throw new Error('ASAAS_API_KEY não configurada')

    const baseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://www.asaas.com/api/v3'
    const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', access_token: apiKey },
      body: JSON.stringify({ nextDueDate, updatePendingPayments: true }),
    })
    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ success: true, subscription: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
