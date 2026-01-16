import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendWebhookNotifications(supabase: any, alert: any, account: any) {
  try {
    // Fetch active webhooks for this user that trigger on low balance
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

    // Send to each webhook
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
          headers: {
            'Content-Type': 'application/json',
          },
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔍 Starting balance check...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all ad accounts with alerts enabled
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id, user_id, account_name, platform, balance, min_balance_alert, alert_enabled')
      .eq('alert_enabled', true)

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError)
      throw accountsError
    }

    console.log(`📊 Found ${accounts?.length || 0} accounts with alerts enabled`)

    const alertsCreated: string[] = []

    for (const account of accounts || []) {
      const balance = Number(account.balance) || 0
      const minBalance = Number(account.min_balance_alert) || 500

      console.log(`Checking ${account.account_name}: balance=${balance}, minBalance=${minBalance}`)

      if (balance < minBalance) {
        // Check if we already sent an alert for this account in the last 24 hours
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

        // Create new alert
        const alertTitle = `⚠️ Saldo baixo: ${account.account_name}`
        const alertMessage = `O saldo da conta ${account.account_name} (${account.platform}) está em R$ ${balance.toFixed(2)}, abaixo do limite configurado de R$ ${minBalance.toFixed(2)}.`

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

          // Send webhook notifications
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