import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CustomerInfo {
  customerId: string
  descriptiveName: string
  currencyCode: string
  manager: boolean
}

// Get customer details using searchStream (more reliable for MCC access)
async function getCustomerDetailsViaSearch(
  customerId: string,
  accessToken: string,
  developerToken: string,
  loginCustomerId: string
): Promise<CustomerInfo | null> {
  try {
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.manager
      FROM customer
      WHERE customer.id = ${customerId}
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
        body: JSON.stringify({ query: query.trim() })
      }
    )

    if (response.ok) {
      const data = await response.json()
      console.log(`Customer ${customerId} search result:`, JSON.stringify(data))
      
      if (data && Array.isArray(data) && data.length > 0) {
        for (const batch of data) {
          if (batch.results && batch.results.length > 0) {
            const customer = batch.results[0].customer
            if (customer) {
              return {
                customerId: customer.id || customerId,
                descriptiveName: customer.descriptiveName || '',
                currencyCode: customer.currencyCode || 'BRL',
                manager: customer.manager || false
              }
            }
          }
        }
      }
    } else {
      const errorText = await response.text()
      console.log(`Could not search customer ${customerId}:`, errorText)
    }
    
    return null
  } catch (error) {
    console.log(`Error searching customer ${customerId}:`, error)
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
      console.log(`Manager ${managerId} clients response:`, JSON.stringify(data))

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
    const userEmail = userInfo.email || null

    console.log('User info:', JSON.stringify(userInfo))

    // List ALL accessible customers using Google Ads API v19
    const customersResponse = await fetch('https://googleads.googleapis.com/v19/customers:listAccessibleCustomers', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'developer-token': developerToken,
      }
    })

    if (!customersResponse.ok) {
      const errorText = await customersResponse.text()
      console.error('Could not fetch customers:', errorText)
      return new Response(
        JSON.stringify({ error: 'Não foi possível listar as contas do Google Ads. Verifique se o Developer Token está aprovado.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customersData = await customersResponse.json()
    console.log('Accessible customers:', JSON.stringify(customersData))

    if (!customersData.resourceNames || customersData.resourceNames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma conta Google Ads encontrada para este usuário' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${customersData.resourceNames.length} accessible customer(s)`)

    const savedAccounts = []
    const errors = []
    const processedAccounts = new Set<string>() // Avoid duplicates

    // First pass: identify manager accounts and collect all clients with names
    const allAccountsMap = new Map<string, { name: string; isManager: boolean; parentMcc?: string }>()
    const managerIds: string[] = []

    for (const resourceName of customersData.resourceNames) {
      const customerId = resourceName.replace('customers/', '')
      
      // Try to get clients from this account (works if it's a manager)
      const clients = await getManagerClients(customerId, tokenData.access_token, developerToken)
      
      if (clients.length > 0) {
        // This is a manager account
        managerIds.push(customerId)
        console.log(`Manager ${customerId} has ${clients.length} clients`)
        
        // Find the manager's own name in the clients list (it includes itself)
        const managerEntry = clients.find(c => c.clientId === customerId)
        if (managerEntry && managerEntry.descriptiveName) {
          allAccountsMap.set(customerId, {
            name: managerEntry.descriptiveName,
            isManager: true
          })
        } else {
          // Fallback: use ID
          allAccountsMap.set(customerId, {
            name: '',
            isManager: true
          })
        }
        
        // Add all clients
        for (const client of clients) {
          if (client.clientId !== customerId) { // Don't add manager twice
            allAccountsMap.set(client.clientId, {
              name: client.descriptiveName,
              isManager: client.isManager,
              parentMcc: customerId
            })
          }
        }
      } else {
        // Not a manager or no access to clients - mark as regular account
        // We'll try to get its name via searchStream using a manager
        if (!allAccountsMap.has(customerId)) {
          allAccountsMap.set(customerId, {
            name: '',
            isManager: false
          })
        }
      }
    }

    console.log(`Total accounts discovered: ${allAccountsMap.size}`)

    // For accounts without names, try to get name via manager search
    for (const [accountId, info] of allAccountsMap.entries()) {
      if (!info.name && managerIds.length > 0) {
        // Try to get name via first available manager
        const managerId = info.parentMcc || managerIds[0]
        const details = await getCustomerDetailsViaSearch(
          accountId,
          tokenData.access_token,
          developerToken,
          managerId
        )
        if (details && details.descriptiveName) {
          info.name = details.descriptiveName
          info.isManager = details.manager
        }
      }
    }

    // Now save all accounts
    for (const [accountId, info] of allAccountsMap.entries()) {
      if (processedAccounts.has(accountId)) continue
      processedAccounts.add(accountId)

      // Format account name: "Google Ads - [Name]" or fallback to ID
      let accountName: string
      if (info.name && info.name.trim() !== '') {
        accountName = `Google Ads - ${info.name}`
      } else {
        accountName = `Google Ads - ${accountId}`
      }
      
      if (info.isManager) {
        accountName = `${accountName} (MCC)`
      }

      console.log(`Saving account: ${accountName} (${accountId})`)

      try {
        // Store parent MCC in refresh_token for future use
        const refreshTokenData = info.parentMcc 
          ? `${refreshToken}|${clientId}|${clientSecret}|${info.parentMcc}`
          : `${refreshToken}|${clientId}|${clientSecret}`

        const { data: savedAccount, error: saveError } = await supabase
          .from('ad_accounts')
          .upsert({
            user_id: user.id,
            account_id: accountId,
            account_name: accountName,
            platform: 'google',
            email: userEmail,
            access_token: tokenData.access_token,
            refresh_token: refreshTokenData,
            token_expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
            status: 'active',
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,account_id,platform'
          })
          .select()
          .single()

        if (saveError) {
          console.error(`Error saving account ${accountId}:`, saveError)
          errors.push({ customerId: accountId, error: saveError.message })
        } else {
          console.log(`✅ Saved: ${accountName}`)
          savedAccounts.push({
            id: savedAccount.id,
            customerId: accountId,
            name: accountName,
            type: info.isManager ? 'manager' : 'client'
          })
        }
      } catch (accountError) {
        console.error(`Error processing account ${accountId}:`, accountError)
        errors.push({ customerId: accountId, error: accountError instanceof Error ? accountError.message : 'Unknown error' })
      }
    }

    const message = savedAccounts.length === 1 
      ? `1 conta Google Ads conectada com sucesso!`
      : `${savedAccounts.length} contas Google Ads conectadas com sucesso!`

    console.log(`✅ Connection complete: ${savedAccounts.length} accounts saved`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        accounts: savedAccounts,
        errors: errors.length > 0 ? errors : undefined,
        message
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
