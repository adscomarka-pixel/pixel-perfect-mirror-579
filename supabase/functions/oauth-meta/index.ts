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
    const metaAppId = Deno.env.get('META_APP_ID')
    const metaAppSecret = Deno.env.get('META_APP_SECRET')

    if (!metaAppId || !metaAppSecret) {
      return new Response(
        JSON.stringify({ error: 'Meta App credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const { action, code, redirectUri } = await req.json()

    if (action === 'get_auth_url') {
      const scope = 'ads_management,ads_read,business_management'
      // Use state parameter for CSRF protection and to pass platform info
      const state = crypto.randomUUID()
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`
      
      console.log('Meta OAuth URL generated:', authUrl)
      console.log('Redirect URI:', redirectUri)
      
      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'exchange_code') {
      // Exchange code for access token
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${metaAppId}&client_secret=${metaAppSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
      
      const tokenResponse = await fetch(tokenUrl)
      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get long-lived token
      const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${tokenData.access_token}`
      
      const longLivedResponse = await fetch(longLivedUrl)
      const longLivedData = await longLivedResponse.json()

      const accessToken = longLivedData.access_token || tokenData.access_token
      const expiresIn = longLivedData.expires_in || 3600

      // Get user info and ad accounts
      const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`)
      const meData = await meResponse.json()

      const adAccountsResponse = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,balance,spend_cap&access_token=${accessToken}`)
      const adAccountsData = await adAccountsResponse.json()

      if (!adAccountsData.data || adAccountsData.data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No ad accounts found for this user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Save ad accounts to database
      const savedAccounts = []
      for (const account of adAccountsData.data) {
        const { data: savedAccount, error: saveError } = await supabase
          .from('ad_accounts')
          .upsert({
            user_id: user.id,
            account_id: account.id.replace('act_', ''),
            account_name: account.name,
            platform: 'meta',
            email: meData.email,
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
            balance: account.balance ? parseFloat(account.balance) / 100 : 0,
            status: account.account_status === 1 ? 'active' : 'inactive',
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,account_id,platform'
          })
          .select()
          .single()

        if (!saveError) {
          savedAccounts.push(savedAccount)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          accounts: savedAccounts,
          message: `Connected ${savedAccounts.length} Meta ad account(s)`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
