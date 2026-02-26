import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendWebhookNotifications(supabase: any, alert: any, account: any) {
  try {
    const { data: webhooks, error } = await supabase
      .from('webhook_integrations')
      .select('*')
      .eq('user_id', account.user_id)
      .eq('is_active', true)
      .eq('trigger_on_low_balance', true)

    if (error) {
      console.error('Error fetching webhooks:', error)
      return
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks configured for low balance alerts')
      return
    }

    for (const webhook of webhooks) {
      try {
        const payload = {
          type: 'low_balance',
          alert: {
            title: alert.title,
            message: alert.message,
            sent_at: alert.sent_at,
          },
          account: {
            name: account.account_name,
            platform: account.platform,
            balance: account.balance,
            min_balance: account.min_balance_alert,
          },
        }

        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          console.log(`✅ Webhook sent successfully to: ${webhook.name}`)
        } else {
          console.error(`❌ Webhook failed for ${webhook.name}: ${response.status}`)
        }
      } catch (webhookError) {
        console.error(`❌ Error sending webhook to ${webhook.name}:`, webhookError)
      }
    }
  } catch (error) {
    console.error('Error in sendWebhookNotifications:', error)
  }
}

// FUNÇÃO AUXILIAR: Converte "3.890,75" ou "100.00" para número float
function parseBalanceToNumber(balanceStr: any): number {
  if (!balanceStr) return 0;
  
  // Se já for número, retorna direto
  if (typeof balanceStr === 'number') return balanceStr;
  
  const str = String(balanceStr);
  
  // Verifica se o formato é brasileiro (ex: 3.890,75) ou americano (3890.75)
  // Se tiver vírgula, tratamos como formato BR
  if (str.includes(',')) {
    const cleanStr = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  }
  
  // Se não tiver vírgula, tenta converter diretamente (ex: "540.26")
  return parseFloat(str) || 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔍 Starting balance check...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select(`
        id, 
        user_id, 
        account_name, 
        platform, 
        balance, 
        min_balance_alert, 
        alert_enabled,
        client_id,
        clients (enable_balance_check)
      `)
      .eq('alert_enabled', true)

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError)
      throw accountsError
    }

    console.log(`📊 Found ${accounts?.length || 0} accounts with alerts enabled`)

    const alertsCreated: string[] = []

    for (const account of accounts || []) {
      if (account.client_id && account.clients && account.clients.enable_balance_check === false) {
        console.log(`⏭️ Skipping ${account.account_name} - balance check disabled for client`)
        continue
      }

      // USO DA NOVA FUNÇÃO DE PARSE PARA LER A STRING
      const balanceNum = parseBalanceToNumber(account.balance)
      const minBalance = Number(account.min_balance_alert) || 500

      console.log(`Checking ${account.account_name}: text_balance="${account.balance}" -> parsed_balance=${balanceNum}, minBalance=${minBalance}`)

      if (balanceNum < minBalance) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { data: recentAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('ad_account_id', account.id)
          .eq('type', 'low_balance')
          .gte('sent_at', twentyFourHoursAgo)
          .limit(1)

        if (recentAlert && recentAlert.length > 0) {
          console.log(`⏭️ Skipping ${account.account_name} - alert already sent in last 24h`)
          continue
        }

        const alertTitle = `⚠️ Saldo baixo: ${account.account_name}`
        const alertMessage = `O saldo da conta ${account.account_name} (${account.platform}) está em R$ ${balanceNum.toFixed(2).replace('.', ',')}, abaixo do limite configurado de R$ ${minBalance.toFixed(2).replace('.', ',')}.`

        const alertData = {
          user_id: account.user_id,
          ad_account_id: account.id,
          title: alertTitle,
          message: alertMessage,
          type: 'low_balance',
          is_read: false,
          sent_at: new Date().toISOString()
        }

        const { error: insertError } = await supabase
          .from('alerts')
          .insert(alertData)

        if (insertError) {
          console.error(`❌ Error creating alert for ${account.account_name}:`, insertError)
        } else {
          console.log(`✅ Alert created for ${account.account_name}`)
          alertsCreated.push(account.account_name)

          await sendWebhookNotifications(supabase, alertData, account)
        }
      }
    }

    const response = {
      success: true,
      accountsChecked: accounts?.length || 0,
      alertsCreated: alertsCreated.length,
      alertedAccounts: alertsCreated
    }

    console.log('✅ Balance check completed:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Error in check-balance-alerts:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})