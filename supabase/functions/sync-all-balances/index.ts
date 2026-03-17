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

    // 1. Buscar TODAS as contas que têm algum tipo de credencial (Token ou Refresh Token)
    // Filtramos apenas as que possuem os campos preenchidos
    const { data: allAccountsWithTokens, error: fetchError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('status', 'active')

    if (fetchError) throw fetchError

    // Filtragem em memória para garantir precisão
    const metaTokens = new Map<string, any>()
    const googleTokens = new Map<string, any>()

    allAccountsWithTokens?.forEach(acc => {
      if (acc.platform === 'meta' && acc.access_token && acc.access_token.length > 20) {
        metaTokens.set(acc.access_token, acc)
      } else if (acc.platform === 'google' && acc.refresh_token && acc.refresh_token.length > 10) {
        googleTokens.set(acc.refresh_token, acc)
      }
    })

    console.log(`📊 Contas encontradas: Total=${allAccountsWithTokens?.length}, Meta=${metaTokens.size}, Google=${googleTokens.size}`)

    if (metaTokens.size === 0 && googleTokens.size === 0) {
        console.warn("⚠️ Nenhuma conta com credenciais ativas foi encontrada no banco.")
    }

    // Fetch DB info for all accounts to use in alerts after sync
    const { data: dbAccounts } = await supabase
      .from('ad_accounts')
      .select('id, account_id, client_id, min_balance_alert, alert_enabled, clients(enable_balance_check)')

    // ---------------------------------------------------------
    // META SYNC
    // ---------------------------------------------------------
    for (const [token, manager] of metaTokens.entries()) {
      try {
        const allAccountsData = []
        const fields = "id,name,account_status,balance,available_balance,spend_cap,amount_spent,is_prepay_account,funding_source_details{amount_available,type,display_name,display_string},insights.date_preset(today){spend}"
        let nextUrl = `https://graph.facebook.com/v21.0/me/adaccounts?fields=${fields}&limit=50&access_token=${token}`

        while (nextUrl) {
          const response = await fetch(nextUrl)
          const data = await response.json()
          if (data.error) throw new Error(data.error.message)
          if (data.data) allAccountsData.push(...data.data)
          nextUrl = data.paging?.next || null
        }

        let count = 0
        for (const account of allAccountsData) {
          const account_id = account.id.replace('act_', '')
          const dbAcc = dbAccounts?.find((a: any) => a.account_id === account_id && a.platform === 'meta')
          
          // Robust Balance Logic
          let balanceValue = 0;
          const isPrepay = account.is_prepay_account === true || account.is_prepay_account === 'true' || account.is_prepay_account === 1;
          const rawBalance = account.balance ? parseFloat(account.balance) / 100 : 0;
          const rawAvailable = account.available_balance ? parseFloat(account.available_balance) / 100 : 0;
          const spendCap = account.spend_cap ? parseFloat(account.spend_cap) / 100 : 0;
          const amountSpent = account.amount_spent ? parseFloat(account.amount_spent) / 100 : 0;
          const fundingAvailable = account.funding_source_details?.amount_available ? parseFloat(account.funding_source_details.amount_available) / 100 : 0;

          let displayStringValue = 0;
          if (account.funding_source_details?.display_string) {
            const displayString = account.funding_source_details.display_string;
            const match = displayString.match(/R\$\s*([\d\.,]+)/) || displayString.match(/[\d\.,]+/g);
            if (match) {
              const valStr = (Array.isArray(match) && match[1] ? match[1] : (Array.isArray(match) ? match[match.length - 1] : match)).replace(/\./g, '').replace(',', '.');
              displayStringValue = parseFloat(valStr);
            }
          }

          if (isPrepay) {
            if (displayStringValue > 0) balanceValue = displayStringValue;
            else if (fundingAvailable > 0) balanceValue = fundingAvailable;
            else if (rawAvailable > 0) balanceValue = rawAvailable;
            else if (spendCap > 0) balanceValue = Math.max(0, spendCap - amountSpent);
            else if (rawBalance < 0) balanceValue = Math.abs(rawBalance);
          } else {
            if (rawAvailable > 0) balanceValue = rawAvailable;
            else if (spendCap > 0) balanceValue = Math.max(0, spendCap - amountSpent);
            else if (rawBalance < 0) balanceValue = Math.abs(rawBalance);
          }

          const finalValue = balanceValue.toFixed(2).replace('.', ',');
          let dailySpend = 0;
          if (account.insights?.data?.[0]?.spend) {
            dailySpend = parseFloat(account.insights.data[0].spend);
          }

          const { error: upError } = await supabase
            .from('ad_accounts')
            .update({
              balance: finalValue,
              daily_spend: dailySpend,
              status: account.account_status === 1 ? 'active' : 'disconnected',
              last_sync_at: new Date().toISOString()
            })
            .eq('account_id', account_id)
            .eq('platform', 'meta')

          if (!upError) {
            count++
            // Alert logic
            if (dbAcc && dbAcc.client_id) {
              const minBalance = Number(dbAcc.min_balance_alert) || 500
              if (balanceValue < minBalance && dbAcc.alert_enabled && (dbAcc.clients as any)?.enable_balance_check) {
                // ... Alert insert logic omitted for brevity in thought, but I will include it
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                const { data: recentAlert } = await supabase
                  .from('alerts')
                  .select('id')
                  .eq('ad_account_id', dbAcc.id)
                  .eq('type', 'low_balance')
                  .gte('sent_at', twentyFourHoursAgo)
                  .limit(1)

                if (!recentAlert || recentAlert.length === 0) {
                  await supabase.from('alerts').insert({
                    user_id: manager.user_id,
                    ad_account_id: dbAcc.id,
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
    }

    // ---------------------------------------------------------
    // GOOGLE SYNC
    // ---------------------------------------------------------
    for (const [refreshToken, manager] of googleTokens.entries()) {
      if (!googleDevToken) continue
      try {
        const accessToken = await refreshGoogleToken(refreshToken)
        if (!accessToken) throw new Error('Could not refresh Google token')

        const { data: subAccounts } = await supabase
          .from('ad_accounts')
          .select('*')
          .eq('user_id', manager.user_id)
          .eq('platform', 'google')
          .eq('is_manager', false)

        let count = 0
        for (const sub of subAccounts || []) {
          // Fetch Spend
          const querySpend = `SELECT metrics.cost_micros FROM customer WHERE segments.date DURING TODAY`
          const loginCustomerId = refreshToken.split('|')[3] || manager.account_id
          const resSpend = await fetch(`https://googleads.googleapis.com/v19/customers/${sub.account_id}/googleAds:searchStream`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': googleDevToken,
              'login-customer-id': loginCustomerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: querySpend.trim() })
          })

          let dailySpend = 0
          if (resSpend.ok) {
            const data = await resSpend.json()
            if (Array.isArray(data)) {
              data.forEach(batch => batch.results?.forEach((r: any) => {
                if (r.metrics?.costMicros) dailySpend += parseInt(r.metrics.costMicros) / 1000000
              }))
            }
          }

          // Fetch Budget
          const queryBudget = `SELECT account_budget.approved_spending_limit_micros, account_budget.amount_served_micros FROM account_budget WHERE account_budget.status = 'APPROVED'`
          const resBudget = await fetch(`https://googleads.googleapis.com/v19/customers/${sub.account_id}/googleAds:searchStream`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': googleDevToken,
              'login-customer-id': loginCustomerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: queryBudget.trim() })
          })

          let balance = 0
          if (resBudget.ok) {
            const data = await resBudget.json()
            if (Array.isArray(data)) {
              data.forEach(batch => {
                const b = batch.results?.[0]?.accountBudget
                if (b) {
                  const limit = parseInt(b.approvedSpendingLimitMicros || '0') / 1000000
                  const served = parseInt(b.amountServedMicros || '0') / 1000000
                  balance = Math.max(0, limit - served)
                }
              })
            }
          }

          const finalVal = balance.toFixed(2).replace('.', ',')
          await supabase
            .from('ad_accounts')
            .update({
              balance: finalVal,
              daily_spend: dailySpend,
              last_sync_at: new Date().toISOString()
            })
            .eq('id', sub.id)
          count++
        }
        results.push({ platform: 'google', managerId: manager.account_id, success: true, processed: count })
      } catch (e) {
        results.push({ platform: 'google', managerId: manager.account_id, success: false, processed: 0, error: e.message })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Master Sync Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
