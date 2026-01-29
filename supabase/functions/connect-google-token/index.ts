import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const developerToken = Deno.env.get('GOOGLE_DEVELOPER_TOKEN')

    if (!developerToken) {
      return new Response(
        JSON.stringify({ error: 'Google Ads Developer Token not configured on server' }),
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

    const { refreshToken, clientId, clientSecret } = await req.json()

    if (!refreshToken || !clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Refresh Token, Client ID e Client Secret são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Exchanging refresh token for access token...')

    // Exchange refresh token for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData)
      return new Response(
        JSON.stringify({ error: tokenData.error_description || tokenData.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Access token obtained successfully')

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    const userInfo = await userInfoResponse.json()

    console.log('User info:', JSON.stringify(userInfo))

    // Try to get Google Ads customers using the correct API version
    let accountName = userInfo.name || 'Google Ads Account'
    let accountId: string | null = null
    let userEmail = userInfo.email || null

    try {
      // List accessible customers using Google Ads API v19
      const customersResponse = await fetch('https://googleads.googleapis.com/v19/customers:listAccessibleCustomers', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'developer-token': developerToken,
        }
      })

      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        console.log('Accessible customers:', JSON.stringify(customersData))
        
        if (customersData.resourceNames && customersData.resourceNames.length > 0) {
          // Extract first customer ID (format: customers/1234567890)
          const firstCustomer = customersData.resourceNames[0]
          accountId = firstCustomer.replace('customers/', '')
          accountName = `Google Ads - ${accountId}`
        }
      } else {
        const errorText = await customersResponse.text()
        console.log('Could not fetch customers:', errorText)
      }
    } catch (adsError) {
      console.log('Google Ads API error (continuing with basic info):', adsError)
    }

    // If we couldn't get the account ID from Google Ads API, use a fallback
    if (!accountId) {
      // Generate a unique account ID based on user info or timestamp
      accountId = userInfo.id || `google_${Date.now()}`
      accountName = userInfo.name ? `Google Ads - ${userInfo.name}` : `Google Ads Account`
      console.log('Using fallback account ID:', accountId)
    }

    // Save account to database - store refresh token, client id/secret for future token refresh
    const { data: savedAccount, error: saveError } = await supabase
      .from('ad_accounts')
      .upsert({
        user_id: user.id,
        account_id: accountId,
        account_name: accountName,
        platform: 'google',
        email: userEmail,
        access_token: tokenData.access_token,
        refresh_token: `${refreshToken}|${clientId}|${clientSecret}`, // Store all for future refresh
        token_expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
        status: 'active',
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,account_id,platform'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving account:', saveError)
      return new Response(
        JSON.stringify({ error: 'Falha ao salvar a conta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Account saved successfully:', savedAccount.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        account: savedAccount,
        message: 'Conta Google Ads conectada com sucesso!'
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
