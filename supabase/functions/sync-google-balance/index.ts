import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface GoogleAdsMetrics {
  balance: number
  dailySpend: number
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
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
      console.error('Token refresh error:', tokenData)
      return null
    }

    return tokenData.access_token
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

async function fetchGoogleAdsMetrics(
  customerId: string,
  accessToken: string,
  developerToken: string
): Promise<GoogleAdsMetrics> {
  try {
    // Get today's date and 30 days ago for spend calculation
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0].replace(/-/g, '')
    
    console.log(`📊 Fetching Google Ads metrics for customer ${customerId}`)

    // Query for account budget/balance info and today's spend
    // Google Ads uses GAQL (Google Ads Query Language)
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        metrics.cost_micros
      FROM customer
      WHERE segments.date DURING TODAY
    `

    const searchResponse = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() })
      }
    )

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.log('Google Ads search error:', errorText)
      
      // Try alternative query for basic account info
      return await fetchBasicMetrics(customerId, accessToken, developerToken)
    }

    const searchData = await searchResponse.json()
    console.log('Google Ads search response:', JSON.stringify(searchData))

    let dailySpend = 0
    
    if (searchData && Array.isArray(searchData)) {
      for (const batch of searchData) {
        if (batch.results) {
          for (const result of batch.results) {
            if (result.metrics?.costMicros) {
              dailySpend += parseInt(result.metrics.costMicros) / 1000000
            }
          }
        }
      }
    }

    // Try to get budget information
    const budgetQuery = `
      SELECT
        account_budget.amount_micros,
        account_budget.spending_limit_micros,
        account_budget.approved_spending_limit_micros
      FROM account_budget
      WHERE account_budget.status = 'APPROVED'
    `

    let balance = 0

    try {
      const budgetResponse = await fetch(
        `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: budgetQuery.trim() })
        }
      )

      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json()
        console.log('Budget response:', JSON.stringify(budgetData))

        if (budgetData && Array.isArray(budgetData)) {
          for (const batch of budgetData) {
            if (batch.results) {
              for (const result of batch.results) {
                const budget = result.accountBudget
                if (budget?.approvedSpendingLimitMicros) {
                  balance = parseInt(budget.approvedSpendingLimitMicros) / 1000000
                } else if (budget?.spendingLimitMicros) {
                  balance = parseInt(budget.spendingLimitMicros) / 1000000
                } else if (budget?.amountMicros) {
                  balance = parseInt(budget.amountMicros) / 1000000
                }
              }
            }
          }
        }
      }
    } catch (budgetError) {
      console.log('Could not fetch budget info:', budgetError)
    }

    console.log(`✅ Metrics for ${customerId}: balance=${balance}, dailySpend=${dailySpend}`)

    return { balance, dailySpend }
  } catch (error) {
    console.error('Error fetching Google Ads metrics:', error)
    return { balance: 0, dailySpend: 0 }
  }
}

async function fetchBasicMetrics(
  customerId: string,
  accessToken: string,
  developerToken: string
): Promise<GoogleAdsMetrics> {
  try {
    // Simpler query that should work for most accounts
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name
      FROM customer
      LIMIT 1
    `

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() })
      }
    )

    if (response.ok) {
      const data = await response.json()
      console.log('Basic metrics response:', JSON.stringify(data))
    }

    // For accounts without searchStream access, try the customer resource directly
    const customerResponse = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
        }
      }
    )

    if (customerResponse.ok) {
      const customerData = await customerResponse.json()
      console.log('Customer data:', JSON.stringify(customerData))
    }

    return { balance: 0, dailySpend: 0 }
  } catch (error) {
    console.log('Basic metrics error:', error)
    return { balance: 0, dailySpend: 0 }
  }
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
        JSON.stringify({ error: 'Google Ads Developer Token not configured' }),
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

    const body = await req.json().catch(() => ({}))
    const { accountId } = body

    console.log(`🔄 Syncing Google Ads balance for user ${user.id}, account: ${accountId || 'all'}`)

    // Fetch Google accounts for this user
    let query = supabase
      .from('ad_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'google')

    if (accountId) {
      query = query.eq('id', accountId)
    }

    const { data: accounts, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching accounts:', fetchError)
      throw fetchError
    }

    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma conta Google Ads encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 Found ${accounts.length} Google Ads account(s) to sync`)

    const syncResults = []

    for (const account of accounts) {
      try {
        // Parse stored refresh token data
        const refreshTokenData = account.refresh_token || ''
        const [refreshToken, clientId, clientSecret] = refreshTokenData.split('|')

        if (!refreshToken || !clientId || !clientSecret) {
          console.log(`⚠️ Account ${account.account_name} missing credentials`)
          syncResults.push({
            accountId: account.id,
            accountName: account.account_name,
            success: false,
            error: 'Credenciais incompletas'
          })
          continue
        }

        // Refresh access token
        const accessToken = await refreshAccessToken(refreshToken, clientId, clientSecret)

        if (!accessToken) {
          console.log(`⚠️ Could not refresh token for ${account.account_name}`)
          syncResults.push({
            accountId: account.id,
            accountName: account.account_name,
            success: false,
            error: 'Falha ao atualizar token'
          })
          continue
        }

        // Update access token in database
        await supabase
          .from('ad_accounts')
          .update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
          })
          .eq('id', account.id)

        // Fetch metrics from Google Ads API
        const metrics = await fetchGoogleAdsMetrics(
          account.account_id,
          accessToken,
          developerToken
        )

        // Update account with new balance and spend
        const { error: updateError } = await supabase
          .from('ad_accounts')
          .update({
            balance: metrics.balance,
            daily_spend: metrics.dailySpend,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', account.id)

        if (updateError) {
          console.error(`Error updating account ${account.account_name}:`, updateError)
          syncResults.push({
            accountId: account.id,
            accountName: account.account_name,
            success: false,
            error: 'Erro ao atualizar dados'
          })
        } else {
          console.log(`✅ Synced ${account.account_name}: balance=${metrics.balance}, spend=${metrics.dailySpend}`)
          syncResults.push({
            accountId: account.id,
            accountName: account.account_name,
            success: true,
            balance: metrics.balance,
            dailySpend: metrics.dailySpend
          })
        }
      } catch (accountError) {
        console.error(`Error syncing account ${account.account_name}:`, accountError)
        syncResults.push({
          accountId: account.id,
          accountName: account.account_name,
          success: false,
          error: accountError instanceof Error ? accountError.message : 'Erro desconhecido'
        })
      }
    }

    const successCount = syncResults.filter(r => r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} de ${syncResults.length} conta(s) sincronizada(s)`,
        results: syncResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in sync-google-balance:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
