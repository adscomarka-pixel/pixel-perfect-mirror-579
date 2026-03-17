import { createClient } from 'supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current time in Brasília (America/Sao_Paulo)
    // We'll use a simple offset since we know it's UTC-3
    const now = new Date()
    const brTime = new Date(now.getTime() - (3 * 60 * 60 * 1000))
    
    const currentHour = brTime.getUTCHours()
    const currentMinute = brTime.getUTCMinutes()
    
    // Day of week conversion
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = days[brTime.getUTCDay()]
    
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    
    console.log(`🕒 Automation check: Day=${currentDay}, Time=${currentTimeStr} (BRT)`)

    // 1. Process Weekly Reports
    // Fetch users who have reports scheduled for this day and hour
    const { data: usersToReport, error: reportError } = await supabase
      .from('notification_settings')
      .select('user_id, report_day, report_time')
      .eq('weekly_report_enabled', true)
      .eq('report_day', currentDay)
      // Match the hour. Since cron runs every hour, we just check the hour part of HH:MM
      .ilike('report_time', `${currentHour.toString().padStart(2, '0')}:%`)

    if (reportError) console.error('Error fetching users for reports:', reportError)
    
    if (usersToReport && usersToReport.length > 0) {
      console.log(`📊 Found ${usersToReport.length} users for scheduled reports`)
      for (const settings of usersToReport) {
        try {
          // Invoke generate-report for this user
          // We use the service role to act on behalf of the user or we need to pass a valid token.
          // In this case, since it's a cron, we'll let generate-report handle it if we can modify it to accept user_id
          // Or we can manually trigger the same logic. Let's try to invoke the function.
          
          await supabase.functions.invoke('generate-report', {
            body: { 
              periodDays: 7,
              automated: true,
              userId: settings.user_id 
            }
          })
          console.log(`✅ Triggered automated report for user ${settings.user_id}`)
        } catch (e) {
          console.error(`❌ Failed to trigger report for user ${settings.user_id}:`, e)
        }
      }
    }

    // 2. Process Balance Alerts (Already handled by sync-all-balances-cron, 
    // but we can make it more precise based on Settings)
    // The current sync-all-balances runs every 30m globally.
    // If you want it to strictly follow the "Horário de Verificação" in Settings:
    const { data: usersToSync, error: syncError } = await supabase
      .from('notification_settings')
      .select('user_id, balance_alert_days, balance_alert_time')
      .eq('balance_alerts_enabled', true)
      .contains('balance_alert_days', [currentDay])
      .ilike('balance_alert_time', `${currentHour.toString().padStart(2, '0')}:%`)

    if (syncError) console.error('Error fetching users for sync:', syncError)

    if (usersToSync && usersToSync.length > 0) {
      console.log(`🔄 Found ${usersToSync.length} users for scheduled balance sync`)
      // Logic to trigger sync for these specific users
      // For now, sync-all-balances handles all users, so we just log this.
    }

    return new Response(JSON.stringify({ 
      success: true, 
      checked: { day: currentDay, time: currentTimeStr },
      triggeredReports: usersToReport?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Automation error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
