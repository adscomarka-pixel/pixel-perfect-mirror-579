import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

        const { error: insertError } = await supabase
          .from('alerts')
          .insert({
            user_id: account.user_id,
            ad_account_id: account.id,
            title: alertTitle,
            message: alertMessage,
            type: 'low_balance',
            is_read: false,
            sent_at: new Date().toISOString()
          })

        if (insertError) {
          console.error(`❌ Error creating alert for ${account.account_name}:`, insertError)
        } else {
          console.log(`✅ Alert created for ${account.account_name}`)
          alertsCreated.push(account.account_name)
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
