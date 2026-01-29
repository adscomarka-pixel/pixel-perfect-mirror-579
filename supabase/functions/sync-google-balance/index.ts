import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface GoogleAdsMetrics {
  balance: number
  dailySpend: number
  descriptiveName?: string
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

// Get account name via searchStream using MCC
async function getAccountNameViaMCC(
  customerId: string,
  accessToken: string,
  developerToken: string,
  loginCustomerId: string
): Promise<string | null> {
  try {
    // First try to get name from customer_client (if using MCC)
    const clientQuery = `
      SELECT
        customer_client.descriptive_name
      FROM customer_client
      WHERE customer_client.client_customer = 'customers/${customerId}'
    `

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${loginCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'login-customer-id': loginCustomerId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: clientQuery.trim() })
      }
    )

    if (response.ok) {
      const data = await response.json()
      if (data && Array.isArray(data)) {
        for (const batch of data) {
          if (batch.results && batch.results.length > 0) {
            const clientInfo = batch.results[0].customerClient
            if (clientInfo?.descriptiveName) {
              return clientInfo.descriptiveName
            }
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.log(`Error getting name for ${customerId}:`, error)
    return null
  }
}

async function fetchGoogleAdsMetrics(
  customerId: string,
  accessToken: string,
  developerToken: string,
  loginCustomerId?: string
): Promise<GoogleAdsMetrics> {
  try {
    console.log(`📊 Fetching Google Ads metrics for customer ${customerId}`)

    let descriptiveName: string | undefined

    // Query for customer info and today's spend
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        metrics.cost_micros
      FROM customer
      WHERE segments.date DURING TODAY
    `

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    }
    
    // Use login-customer-id if we have an MCC
    if (loginCustomerId && loginCustomerId !== customerId) {
      headers['login-customer-id'] = loginCustomerId
    }

    const searchResponse = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: query.trim() })
      }
    )

    let dailySpend = 0

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      console.log('Google Ads search response:', JSON.stringify(searchData))

      if (searchData && Array.isArray(searchData)) {
        for (const batch of searchData) {
          if (batch.results) {
            for (const result of batch.results) {
              if (result.metrics?.costMicros) {
                dailySpend += parseInt(result.metrics.costMicros) / 1000000
              }
              // Get descriptive name from the first result
              if (!descriptiveName && result.customer?.descriptiveName) {
                descriptiveName = result.customer.descriptiveName
              }
            }
          }
        }
      }
    } else {
      const errorText = await searchResponse.text()
      console.log('Google Ads search error:', errorText)
      
      // If direct access failed and we have an MCC, try via MCC
      if (loginCustomerId && loginCustomerId !== customerId) {
        descriptiveName = await getAccountNameViaMCC(customerId, accessToken, developerToken, loginCustomerId) || undefined
      }
    }

    // If we still don't have a name, try a simpler query
    if (!descriptiveName) {
      const simpleQuery = `
        SELECT customer.descriptive_name
        FROM customer
        LIMIT 1
      `
      
      try {
        const simpleResponse = await fetch(
          `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: simpleQuery.trim() })
          }
        )

        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json()
          if (simpleData && Array.isArray(simpleData)) {
            for (const batch of simpleData) {
              if (batch.results && batch.results.length > 0) {
                descriptiveName = batch.results[0].customer?.descriptiveName
                break
              }
            }
          }
        }
      } catch (e) {
        console.log('Simple query failed:', e)
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
          headers,
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

    console.log(`✅ Metrics for ${customerId}: balance=${balance}, dailySpend=${dailySpend}, name=${descriptiveName}`)

    return { balance, dailySpend, descriptiveName }
  } catch (error) {
    console.error('Error fetching Google Ads metrics:', error)
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
    const { accountId, updateNames } = body

    console.log(`🔄 Syncing Google Ads balance for user ${user.id}, account: ${accountId || 'all'}, updateNames: ${updateNames}`)

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
        const parts = refreshTokenData.split('|')
        const refreshToken = parts[0]
        const clientId = parts[1]
        const clientSecret = parts[2]
        const loginCustomerId = parts[3] // MCC ID if available

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
          developerToken,
          loginCustomerId
        )

        // Build update object
        const updateData: Record<string, unknown> = {
          balance: metrics.balance,
          daily_spend: metrics.dailySpend,
          last_sync_at: new Date().toISOString()
        }

        // Update account name if we got a descriptive name and either:
        // 1. updateNames flag is true, or
        // 2. Current name is just the ID (Google Ads - [ID])
        const currentNameIsJustId = account.account_name?.match(/^Google Ads - \d+(\s*\(MCC\))?$/)
        
        if (metrics.descriptiveName && (updateNames || currentNameIsJustId)) {
          const isManager = account.account_name?.includes('(MCC)')
          let newName = `Google Ads - ${metrics.descriptiveName}`
          if (isManager) {
            newName = `${newName} (MCC)`
          }
          updateData.account_name = newName
          console.log(`📝 Updating name: ${account.account_name} -> ${newName}`)
        }

        // Update account with new data
        const { error: updateError } = await supabase
          .from('ad_accounts')
          .update(updateData)
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
          const newName = updateData.account_name || account.account_name
          console.log(`✅ Synced ${newName}: balance=${metrics.balance}, spend=${metrics.dailySpend}`)
          syncResults.push({
            accountId: account.id,
            accountName: newName,
            success: true,
            balance: metrics.balance,
            dailySpend: metrics.dailySpend,
            nameUpdated: !!updateData.account_name
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
    const namesUpdated = syncResults.filter(r => r.nameUpdated).length

    let message = `${successCount} de ${syncResults.length} conta(s) sincronizada(s)`
    if (namesUpdated > 0) {
      message += `. ${namesUpdated} nome(s) atualizado(s)`
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
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
