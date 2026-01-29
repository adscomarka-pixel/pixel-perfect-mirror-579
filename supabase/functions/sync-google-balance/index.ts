import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface GoogleAdsMetrics {
  balance: number
  dailySpend: number
  descriptiveName?: string
  isManager?: boolean
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
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

    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in || 3600
    }
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

// Get all clients under a manager account with their descriptive names
async function getManagerClients(
  managerId: string,
  accessToken: string,
  developerToken: string
): Promise<Array<{ clientId: string; descriptiveName: string; isManager: boolean }>> {
  const clients: Array<{ clientId: string; descriptiveName: string; isManager: boolean }> = []
  
  try {
    const query = `
      SELECT
        customer_client.client_customer,
        customer_client.descriptive_name,
        customer_client.manager,
        customer_client.status
      FROM customer_client
      WHERE customer_client.status = 'ENABLED'
    `

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${managerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'login-customer-id': managerId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() })
      }
    )

    if (response.ok) {
      const data = await response.json()

      if (data && Array.isArray(data)) {
        for (const batch of data) {
          if (batch.results) {
            for (const result of batch.results) {
              const clientCustomer = result.customerClient
              if (clientCustomer && clientCustomer.clientCustomer) {
                const clientId = clientCustomer.clientCustomer.replace('customers/', '')
                clients.push({
                  clientId,
                  descriptiveName: clientCustomer.descriptiveName || '',
                  isManager: clientCustomer.manager || false
                })
              }
            }
          }
        }
      }
    } else {
      const errorText = await response.text()
      console.log(`Could not fetch clients for manager ${managerId}:`, errorText)
    }
  } catch (error) {
    console.log(`Error fetching clients for manager ${managerId}:`, error)
  }
  
  return clients
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
    let isManager = false

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    }
    
    if (loginCustomerId && loginCustomerId !== customerId) {
      headers['login-customer-id'] = loginCustomerId
    }

    // Query for customer info and today's spend
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.manager,
        metrics.cost_micros
      FROM customer
      WHERE segments.date DURING TODAY
    `

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

      if (searchData && Array.isArray(searchData)) {
        for (const batch of searchData) {
          if (batch.results) {
            for (const result of batch.results) {
              if (result.metrics?.costMicros) {
                dailySpend += parseInt(result.metrics.costMicros) / 1000000
              }
              if (!descriptiveName && result.customer?.descriptiveName) {
                descriptiveName = result.customer.descriptiveName
              }
              if (result.customer?.manager) {
                isManager = true
              }
            }
          }
        }
      }
    } else {
      // Try simpler query
      const simpleQuery = `SELECT customer.descriptive_name, customer.manager FROM customer LIMIT 1`
      
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
                isManager = batch.results[0].customer?.manager || false
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
    let balance = 0
    try {
      const budgetQuery = `
        SELECT
          account_budget.approved_spending_limit_micros,
          account_budget.spending_limit_micros,
          account_budget.amount_micros
        FROM account_budget
        WHERE account_budget.status = 'APPROVED'
      `

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

    console.log(`✅ Metrics for ${customerId}: balance=${balance}, dailySpend=${dailySpend}, name=${descriptiveName}, manager=${isManager}`)

    return { balance, dailySpend, descriptiveName, isManager }
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
    const { accountId, fullRefresh } = body

    console.log(`🔄 Syncing Google Ads for user ${user.id}, account: ${accountId || 'all'}, fullRefresh: ${fullRefresh}`)

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
    const processedCredentials = new Set<string>()
    let newAccountsCount = 0

    for (const account of accounts) {
      try {
        const refreshTokenData = account.refresh_token || ''
        const parts = refreshTokenData.split('|')
        const refreshToken = parts[0]
        const clientId = parts[1]
        const clientSecret = parts[2]
        const storedMccId = parts[3]

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

        const credentialKey = `${refreshToken}|${clientId}`
        
        // Refresh access token
        const tokenResult = await refreshAccessToken(refreshToken, clientId, clientSecret)

        if (!tokenResult) {
          console.log(`⚠️ Could not refresh token for ${account.account_name}`)
          syncResults.push({
            accountId: account.id,
            accountName: account.account_name,
            success: false,
            error: 'Falha ao atualizar token'
          })
          continue
        }

        const { accessToken, expiresIn } = tokenResult

        // If fullRefresh and we haven't processed these credentials yet, discover new accounts
        if (fullRefresh && !processedCredentials.has(credentialKey)) {
          processedCredentials.add(credentialKey)
          
          console.log(`🔍 Discovering new accounts for credential set...`)
          
          // List all accessible customers
          const customersResponse = await fetch('https://googleads.googleapis.com/v19/customers:listAccessibleCustomers', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': developerToken,
            }
          })

          if (customersResponse.ok) {
            const customersData = await customersResponse.json()
            
            if (customersData.resourceNames) {
              const allAccountsMap = new Map<string, { name: string; isManager: boolean; parentMcc?: string }>()
              
              for (const resourceName of customersData.resourceNames) {
                const customerId = resourceName.replace('customers/', '')
                
                // Try to get clients from this account (works if it's a manager)
                const clients = await getManagerClients(customerId, accessToken, developerToken)
                
                if (clients.length > 0) {
                  // This is a manager account
                  const managerEntry = clients.find(c => c.clientId === customerId)
                  allAccountsMap.set(customerId, {
                    name: managerEntry?.descriptiveName || '',
                    isManager: true
                  })
                  
                  for (const client of clients) {
                    if (client.clientId !== customerId) {
                      allAccountsMap.set(client.clientId, {
                        name: client.descriptiveName,
                        isManager: client.isManager,
                        parentMcc: customerId
                      })
                    }
                  }
                } else {
                  if (!allAccountsMap.has(customerId)) {
                    allAccountsMap.set(customerId, { name: '', isManager: false })
                  }
                }
              }

              // Check for new accounts and add them
              const existingAccountIds = new Set(accounts.map(a => a.account_id))
              
              for (const [accountIdStr, info] of allAccountsMap.entries()) {
                if (!existingAccountIds.has(accountIdStr)) {
                  // New account found!
                  let accountName = info.name && info.name.trim() !== '' 
                    ? `Google Ads - ${info.name}` 
                    : `Google Ads - ${accountIdStr}`
                  
                  if (info.isManager) {
                    accountName = `${accountName} (MCC)`
                  }

                  const refreshTokenForNew = info.parentMcc 
                    ? `${refreshToken}|${clientId}|${clientSecret}|${info.parentMcc}`
                    : `${refreshToken}|${clientId}|${clientSecret}`

                  const { error: insertError } = await supabase
                    .from('ad_accounts')
                    .insert({
                      user_id: user.id,
                      account_id: accountIdStr,
                      account_name: accountName,
                      platform: 'google',
                      email: account.email,
                      access_token: accessToken,
                      refresh_token: refreshTokenForNew,
                      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                      status: 'active',
                      last_sync_at: new Date().toISOString()
                    })

                  if (!insertError) {
                    console.log(`✅ New account discovered: ${accountName}`)
                    newAccountsCount++
                  }
                }
              }
            }
          }
        }

        // Update access token
        await supabase
          .from('ad_accounts')
          .update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
          })
          .eq('id', account.id)

        // Fetch metrics
        const metrics = await fetchGoogleAdsMetrics(
          account.account_id,
          accessToken,
          developerToken,
          storedMccId
        )

        // Build update
        const updateData: Record<string, unknown> = {
          balance: metrics.balance,
          daily_spend: metrics.dailySpend,
          last_sync_at: new Date().toISOString()
        }

        // Update name if we got one and current name is just ID
        const currentNameIsJustId = account.account_name?.match(/^Google Ads - \d+(\s*\(MCC\))?$/)
        
        if (metrics.descriptiveName && (fullRefresh || currentNameIsJustId)) {
          let newName = `Google Ads - ${metrics.descriptiveName}`
          if (metrics.isManager || account.account_name?.includes('(MCC)')) {
            newName = `${newName} (MCC)`
          }
          updateData.account_name = newName
        }

        const { error: updateError } = await supabase
          .from('ad_accounts')
          .update(updateData)
          .eq('id', account.id)

        if (updateError) {
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
    if (newAccountsCount > 0) {
      message += `. ${newAccountsCount} nova(s) conta(s) descoberta(s)`
    }
    if (namesUpdated > 0) {
      message += `. ${namesUpdated} nome(s) atualizado(s)`
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
        results: syncResults,
        newAccounts: newAccountsCount
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
