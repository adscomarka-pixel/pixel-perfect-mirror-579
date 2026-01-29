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

async function getCustomerDetails(
  customerId: string,
  accessToken: string,
  developerToken: string
): Promise<CustomerInfo | null> {
  try {
    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      return {
        customerId: data.id || customerId,
        descriptiveName: data.descriptiveName || `Google Ads - ${customerId}`,
        currencyCode: data.currencyCode || 'BRL',
        manager: data.manager || false
      }
    }
    
    return null
  } catch (error) {
    console.log(`Could not fetch details for customer ${customerId}:`, error)
    return null
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

    // Process ALL accessible customers
    for (const resourceName of customersData.resourceNames) {
      const customerId = resourceName.replace('customers/', '')
      
      console.log(`Processing customer: ${customerId}`)

      // Get customer details
      const customerInfo = await getCustomerDetails(customerId, tokenData.access_token, developerToken)
      
      const accountName = customerInfo?.descriptiveName || `Google Ads - ${customerId}`
      const isManager = customerInfo?.manager || false

      // Skip manager accounts if they have sub-accounts (we'll get those separately)
      // But still save them for reference
      const accountType = isManager ? 'manager' : 'client'

      try {
        // Save account to database - store refresh token, client id/secret for future token refresh
        const { data: savedAccount, error: saveError } = await supabase
          .from('ad_accounts')
          .upsert({
            user_id: user.id,
            account_id: customerId,
            account_name: `${accountName}${isManager ? ' (MCC)' : ''}`,
            platform: 'google',
            email: userEmail,
            access_token: tokenData.access_token,
            refresh_token: `${refreshToken}|${clientId}|${clientSecret}`,
            token_expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
            status: 'active',
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,account_id,platform'
          })
          .select()
          .single()

        if (saveError) {
          console.error(`Error saving account ${customerId}:`, saveError)
          errors.push({ customerId, error: saveError.message })
        } else {
          console.log(`✅ Saved account: ${accountName} (${customerId})`)
          savedAccounts.push({
            id: savedAccount.id,
            customerId,
            name: accountName,
            type: accountType
          })
        }

        // If this is a manager account, try to get linked client accounts
        if (isManager) {
          try {
            console.log(`Fetching client accounts for manager ${customerId}...`)
            
            const clientsQuery = `
              SELECT
                customer_client.client_customer,
                customer_client.descriptive_name,
                customer_client.manager,
                customer_client.status
              FROM customer_client
              WHERE customer_client.status = 'ENABLED'
            `

            const clientsResponse = await fetch(
              `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                  'developer-token': developerToken,
                  'login-customer-id': customerId,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: clientsQuery.trim() })
              }
            )

            if (clientsResponse.ok) {
              const clientsData = await clientsResponse.json()
              console.log(`Manager ${customerId} clients:`, JSON.stringify(clientsData))

              if (clientsData && Array.isArray(clientsData)) {
                for (const batch of clientsData) {
                  if (batch.results) {
                    for (const result of batch.results) {
                      const clientCustomer = result.customerClient
                      if (clientCustomer && clientCustomer.clientCustomer) {
                        const clientId = clientCustomer.clientCustomer.replace('customers/', '')
                        const clientName = clientCustomer.descriptiveName || `Google Ads - ${clientId}`
                        const clientIsManager = clientCustomer.manager || false

                        // Save client account
                        const { data: clientAccount, error: clientError } = await supabase
                          .from('ad_accounts')
                          .upsert({
                            user_id: user.id,
                            account_id: clientId,
                            account_name: `${clientName}${clientIsManager ? ' (MCC)' : ''}`,
                            platform: 'google',
                            email: userEmail,
                            access_token: tokenData.access_token,
                            refresh_token: `${refreshToken}|${clientId}|${clientSecret}|${customerId}`, // Include manager ID
                            token_expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
                            status: 'active',
                            last_sync_at: new Date().toISOString()
                          }, {
                            onConflict: 'user_id,account_id,platform'
                          })
                          .select()
                          .single()

                        if (!clientError && clientAccount) {
                          console.log(`✅ Saved client account: ${clientName} (${clientId})`)
                          savedAccounts.push({
                            id: clientAccount.id,
                            customerId: clientId,
                            name: clientName,
                            type: clientIsManager ? 'manager' : 'client',
                            parentManager: customerId
                          })
                        }
                      }
                    }
                  }
                }
              }
            } else {
              const errorText = await clientsResponse.text()
              console.log(`Could not fetch clients for manager ${customerId}:`, errorText)
            }
          } catch (clientsError) {
            console.log(`Error fetching clients for manager ${customerId}:`, clientsError)
          }
        }
      } catch (accountError) {
        console.error(`Error processing account ${customerId}:`, accountError)
        errors.push({ customerId, error: accountError instanceof Error ? accountError.message : 'Unknown error' })
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
