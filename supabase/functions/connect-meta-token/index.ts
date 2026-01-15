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
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { accessToken } = await req.json()

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token by fetching user info
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`)
    const meData = await meResponse.json()

    if (meData.error) {
      console.error('Meta API error:', meData.error)
      return new Response(
        JSON.stringify({ error: meData.error.message || 'Token inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User info:', meData)

    // Fetch ad accounts using the token
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,balance,spend_cap&access_token=${accessToken}`
    )
    const adAccountsData = await adAccountsResponse.json()

    if (adAccountsData.error) {
      console.error('Ad accounts error:', adAccountsData.error)
      return new Response(
        JSON.stringify({ error: adAccountsData.error.message || 'Erro ao buscar contas de anúncios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Ad accounts found:', adAccountsData.data?.length || 0)

    if (!adAccountsData.data || adAccountsData.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma conta de anúncios encontrada para este usuário' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save ad accounts to database
    const savedAccounts = []
    for (const account of adAccountsData.data) {
      const accountId = account.id.replace('act_', '')
      
      const { data: savedAccount, error: saveError } = await supabase
        .from('ad_accounts')
        .upsert({
          user_id: user.id,
          account_id: accountId,
          account_name: account.name || `Conta ${accountId}`,
          platform: 'meta',
          email: meData.email || null,
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
          balance: account.balance ? parseFloat(account.balance) / 100 : 0,
          status: account.account_status === 1 ? 'active' : 'inactive',
          last_sync_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,account_id,platform'
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving account:', saveError)
      } else {
        savedAccounts.push(savedAccount)
      }
    }

    console.log('Saved accounts:', savedAccounts.length)

    return new Response(
      JSON.stringify({ 
        success: true, 
        accounts: savedAccounts,
        message: `Conectado ${savedAccounts.length} conta(s) Meta Ads com sucesso!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
