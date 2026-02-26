import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { accessToken } = await req.json()
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access token is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 1. Validar usuário na Meta
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`)
    const meData = await meResponse.json()

    if (meData.error) {
      return new Response(JSON.stringify({ error: meData.error.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 2. Busca paginada de TODAS as contas
    let allAdAccounts = []
    const fields = "id,name,account_status,balance,spend_cap,funding_source_details"
    let nextUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=${fields}&limit=50&access_token=${accessToken}`

    while (nextUrl) {
      const response = await fetch(nextUrl)
      const result = await response.json()
      if (result.error) break
      if (result.data) {
        allAdAccounts = [...allAdAccounts, ...result.data]
      }
      nextUrl = result.paging?.next || null
    }

    // 3. Processar e Salvar no Banco
    const savedAccounts = []
    for (const account of allAdAccounts) {
      const accountId = account.id.replace('act_', '')
      
      let finalValue = "0"
      
      // Lógica de extração de apenas números da display_string
      if (account.funding_source_details?.display_string) {
        const displayString = account.funding_source_details.display_string
        
        // Regex para capturar a sequência numérica (ex: 3.890,75 ou 0,00)
        const match = displayString.match(/[\d\.,]+/g)
        
        if (match) {
          // Pegamos o último conjunto de números (geralmente onde está o valor final)
          // E retornamos apenas a string numérica limpa
          finalValue = match[match.length - 1]
        }
      } else {
        // Fallback para contas sem display_string (Pós-pagas)
        finalValue = account.balance ? (parseFloat(account.balance) / 100).toFixed(2).replace('.', ',') : "0,00"
      }
      
      const { data: savedAccount, error: saveError } = await supabase
        .from('ad_accounts')
        .upsert({
          user_id: user.id,
          account_id: accountId,
          account_name: account.name || `Conta ${accountId}`,
          platform: 'meta',
          email: meData.email || null,
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          balance: finalValue, // SALVA APENAS O NÚMERO (Ex: "3.890,75")
          status: account.account_status === 1 ? 'active' : 'inactive',
          last_sync_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,account_id,platform'
        })
        .select()
        .single()

      if (!saveError) savedAccounts.push(savedAccount)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        total_found: allAdAccounts.length,
        saved_count: savedAccounts.length,
        message: `Sincronizadas ${allAdAccounts.length} contas.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})