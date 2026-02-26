import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncResult {
  platform: string
  managerId: string
  success: boolean
  processed: number
  error?: string
}

async function refreshGoogleToken(refreshTokenData: string): Promise<string | null> {
  const parts = refreshTokenData.split('|')
  const refreshToken = parts[0]
  const clientId = parts[1]
  const clientSecret = parts[2]

  if (!refreshToken || !clientId || !clientSecret) return null

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('Google token refresh error:', error)
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
    const googleDevToken = Deno.env.get('GOOGLE_DEVELOPER_TOKEN')

    const supabase = createClient(supabaseUrl, supabaseKey)
    const results: SyncResult[] = []

    // Fetch all manager accounts
    const { data: managers, error: mgrError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('is_manager', true)
      .eq('status', 'active')

    if (mgrError) throw mgrError

    console.log(`🔄 Starting global sync for ${managers?.length || 0} managers`)

    for (const manager of managers || []) {
      if (manager.platform === 'meta') {
        try {
          const allAccountsData = []
          // Adicionado funding_source_details completo na requisição paginada
          let nextUrl = `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status,balance,available_balance,spend_cap,amount_spent,is_prepay_account,extended_credit_invoice_group{id,balance,max_allotted_spending_limit,auto_rollover_limit},funding_source_details{amount_available,type,display_name,display_string},business{id,funding_lines{id,balance,amount,status,currency,display_balance}}&limit=50&access_token=${manager.access_token}`

          while (nextUrl) {
            const response = await fetch(nextUrl)
            const data = await response.json()

            if (data.error) {
              console.error('Meta API Error during pagination:', data.error)
              throw new Error(data.error.message)
            }

            if (data.data) {
              allAccountsData.push(...data.data)
            }

            nextUrl = data.paging?.next || null
          }

          console.log(`📦 Fetched ${allAccountsData.length} accounts for manager ${manager.account_id}`)

          // Fetch existing account info from DB to check client_id and alert settings
          const { data: dbAccounts } = await supabase
            .from('ad_accounts')
            .select('id, account_id, client_id, min_balance_alert, alert_enabled, clients(enable_balance_check)')
            .eq('user_id', manager.user_id)
            .eq('platform', 'meta')

          let count = 0
          for (const account of allAccountsData) {
            const account_id = account.id.replace('act_', '')
            const dbAccount = dbAccounts?.find((a: any) => a.account_id === account_id)

            // LÓGICA DE EXTRAÇÃO DO SALDO (Apenas o número formatado)
            let finalValue = "0,00"

            if (account.funding_source_details?.display_string) {
              const displayString = account.funding_source_details.display_string
              const match = displayString.match(/[\d\.,]+/g)
              if (match) {
                finalValue = match[match.length - 1]
              }
            } else {
              // Fallback para contas sem display_string (Pós-pagas)
              finalValue = account.balance ? (parseFloat(account.balance) / 100).toFixed(2).replace('.', ',') : "0,00"
            }

            // Fetch today's spend for daily_spend
            let dailySpend = 0
            try {
              const todayInsightsRes = await fetch(`https://graph.facebook.com/v21.0/act_${account_id}/insights?fields=spend&date_preset=today&access_token=${manager.access_token}`)
              const todayInsightsData = await todayInsightsRes.json()
              if (todayInsightsData.data && todayInsightsData.data.length > 0) {
                dailySpend = parseFloat(todayInsightsData.data[0].spend || '0')
              }
            } catch (e) {
              console.error(`Error fetching today's spend for ${account_id}:`, e)
            }

            console.log(`Global Sync Meta ${account_id}: Extracted Balance=${finalValue}`)

            // Update account in database
            const { error: upError } = await supabase
              .from('ad_accounts')
              .update({
                balance: finalValue, // SALVANDO A STRING (ex: "3.890,75")
                daily_spend: dailySpend,
                status: account.account_status === 1 ? 'active' : 'inactive',
                last_sync_at: new Date().toISOString(),
                access_token: manager.access_token,
                token_expires_at: manager.token_expires_at
              })
              .eq('user_id', manager.user_id)
              .eq('account_id', account_id)
              .eq('platform', 'meta')

            if (!upError) {
              count++

              // ALERT LOGIC: Only if balance is low and client check is enabled
              if (dbAccount) {
                const minBalance = Number(dbAccount.min_balance_alert) || 500
                const alertEnabled = dbAccount.alert_enabled === true
                const clientEnableCheck = (dbAccount.clients as any)?.enable_balance_check !== false

                // Converter string do Brasil ("3.890,75") para float apenas para a verificação matemática
                const balanceNum = parseFloat(finalValue.replace(/\./g, '').replace(',', '.')) || 0

                if (balanceNum < minBalance && alertEnabled && clientEnableCheck) {
                  // Check for recent alert (last 24h)
                  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                  const { data: recentAlert } = await supabase
                    .from('alerts')
                    .select('id')
                    .eq('ad_account_id', dbAccount.id)
                    .eq('type', 'low_balance')
                    .gte('sent_at', twentyFourHoursAgo)
                    .limit(1)

                  if (!recentAlert || recentAlert.length === 0) {
                    console.log(`🚨 Triggering low balance alert for ${account_id}`)
                    await supabase.from('alerts').insert({
                      user_id: manager.user_id,
                      ad_account_id: dbAccount.id,
                      title: `⚠️ Saldo baixo: ${account.name}`,
                      message: `O saldo da conta ${account.name} (Meta) está em R$ ${finalValue}, abaixo do limite de R$ ${minBalance.toFixed(2).replace('.', ',')}.`,
                      type: 'low_balance',
                      is_read: false,
                      sent_at: new Date().toISOString()
                    })
                  }
                }
              }
            }
          }
          results.push({ platform: 'meta', managerId: manager.account_id, success: true, processed: count })
        } catch (e) {
          results.push({ platform: 'meta', managerId: manager.account_id, success: false, processed: 0, error: e.message })
        }
      } else if (manager.platform === 'google' && googleDevToken) {
        try {
          const accessToken = await refreshGoogleToken(manager.refresh_token || '')
          if (!accessToken) throw new Error('Could not refresh Google token')

          const { data: children } = await supabase
            .from('ad_accounts')
            .select('*')
            .eq('user_id', manager.user_id)
            .eq('platform', 'google')
            .eq('is_manager', false)

          let count = 0
          for (const child of children || []) {
            const query = `
              SELECT
                metrics.cost_micros,
                customer.id
              FROM customer
              WHERE segments.date DURING TODAY
            `
            const loginCustomerId = manager.refresh_token?.split('|')[3] || manager.account_id

            const response = await fetch(
              `https://googleads.googleapis.com/v19/customers/${child.account_id}/googleAds:searchStream`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'developer-token': googleDevToken,
                  'login-customer-id': loginCustomerId,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query.trim() })
              }
            )

            let dailySpend = 0
            if (response.ok) {
              const searchData = await response.json()
              if (Array.isArray(searchData)) {
                for (const batch of searchData) {
                  if (batch.results) {
                    for (const result of batch.results) {
                      if (result.metrics?.costMicros) dailySpend += parseInt(result.metrics.costMicros) / 1000000
                    }
                  }
                }
              }
            }

            const budgetQuery = `SELECT account_budget.approved_spending_limit_micros, account_budget.amount_served_micros FROM account_budget WHERE account_budget.status = 'APPROVED'`
            const budgetRes = await fetch(`https://googleads.googleapis.com/v19/customers/${child.account_id}/googleAds:searchStream`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': googleDevToken,
                'login-customer-id': loginCustomerId,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: budgetQuery.trim() })
            })

            let balance = 0
            if (budgetRes.ok) {
              const budgetData = await budgetRes.json()
              if (Array.isArray(budgetData)) {
                for (const batch of budgetData) {
                  if (batch.results?.[0]?.accountBudget) {
                    const b = batch.results[0].accountBudget
                    const limit = parseInt(b.approvedSpendingLimitMicros || '0') / 1000000
                    const served = parseInt(b.amountServedMicros || '0') / 1000000
                    balance = Math.max(0, limit - served)
                  }
                }
              }
            }

            // Converter o saldo do Google para o mesmo formato string da Meta ("0,00")
            const finalGoogleBalance = balance.toFixed(2).replace('.', ',')

            await supabase
              .from('ad_accounts')
              .update({
                balance: finalGoogleBalance, // SALVANDO FORMATADO
                daily_spend: dailySpend,
                last_sync_at: new Date().toISOString(),
                refresh_token: manager.refresh_token
              })
              .eq('id', child.id)

            count++
          }
          results.push({ platform: 'google', managerId: manager.account_id, success: true, processed: count })
        } catch (e) {
          results.push({ platform: 'google', managerId: manager.account_id, success: false, processed: 0, error: e.message })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Global sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
