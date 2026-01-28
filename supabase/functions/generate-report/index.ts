import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportData {
  productName?: string;
  periodDays?: number;
}

interface AdAccount {
  id: string;
  account_name: string;
  platform: string;
  balance: number;
  daily_spend: number;
}

async function sendWebhookNotifications(supabase: any, report: any, userId: string) {
  try {
    // Fetch active webhooks for this user
    const { data: webhooks, error } = await supabase
      .from('webhook_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching webhooks:', error)
      return
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks configured')
      return
    }

    // Send to each webhook
    for (const webhook of webhooks) {
      try {
        const payload = {
          type: 'account_report',
          report: {
            id: report.id,
            title: report.title,
            message: report.message,
            product_name: report.product_name,
            total_investment: report.total_investment,
            messages_count: report.messages_count,
            cost_per_message: report.cost_per_message,
            period_start: report.period_start,
            period_end: report.period_end,
            created_at: report.created_at,
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
          console.log(`✅ Report webhook sent successfully to: ${webhook.name}`)
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

async function generateReportForAccount(
  supabase: any,
  account: AdAccount,
  userId: string,
  periodDays: number,
  startDate: Date,
  endDate: Date
) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Calculate totals for this specific account
  const dailySpend = Number(account.daily_spend) || 0
  const totalInvestment = dailySpend * periodDays
  
  // Estimate messages based on spend (this would come from API in real implementation)
  // Assuming average CPM of R$30 for estimation
  const totalMessages = Math.floor((dailySpend * periodDays) / 30 * 1000)
  
  // Calculate cost per message
  const costPerMessage = totalMessages > 0 ? totalInvestment / totalMessages : 0

  // Use account name as product name for individual reports
  const productName = account.account_name

  // Create report message
  const reportMessage = `Bom dia,

Segue o relatório de desempenho da conta de anúncios

Produto: ${productName}

📅 Período analisado: Últimos ${periodDays} dias

💰 Investimento total: R$ ${totalInvestment.toFixed(2).replace('.', ',')}

💬 Mensagens iniciadas: ${totalMessages.toLocaleString('pt-BR')}

📈 Custo por mensagens: R$ ${costPerMessage.toFixed(2).replace('.', ',')}

Vamo pra cima!! 🚀`

  const reportTitle = `📊 ${productName} - ${formatDate(startDate)} a ${formatDate(endDate)}`

  // Save report to database
  const reportData = {
    user_id: userId,
    title: reportTitle,
    message: reportMessage,
    product_name: productName,
    period_start: startDate.toISOString().split('T')[0],
    period_end: endDate.toISOString().split('T')[0],
    total_investment: totalInvestment,
    messages_count: totalMessages,
    cost_per_message: costPerMessage,
    is_read: false,
  }

  const { data: insertedReport, error: insertError } = await supabase
    .from('reports')
    .insert(reportData)
    .select()
    .single()

  if (insertError) {
    console.error(`❌ Error creating report for ${productName}:`, insertError)
    throw insertError
  }

  console.log(`✅ Report created for: ${productName}`)

  // Send webhook notifications for this report
  await sendWebhookNotifications(supabase, insertedReport, userId)

  return {
    account: productName,
    report: insertedReport,
    stats: {
      totalInvestment,
      totalMessages,
      costPerMessage,
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📊 Starting report generation...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Parse request body
    let requestData: ReportData = {}
    try {
      requestData = await req.json()
    } catch {
      // Use defaults if no body
    }

    const periodDays = requestData.periodDays || 7

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Format dates for display
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    // Fetch all ad accounts for this user
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id, account_name, platform, balance, daily_spend')
      .eq('user_id', user.id)

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError)
      throw accountsError
    }

    console.log(`📊 Found ${accounts?.length || 0} accounts for user`)

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Nenhuma conta de anúncios encontrada' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Generate individual reports for each account
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const account of accounts) {
      try {
        const result = await generateReportForAccount(
          supabase,
          account,
          user.id,
          periodDays,
          startDate,
          endDate
        )
        results.push(result)
        successCount++
        console.log(`✅ Report ${successCount}/${accounts.length} generated for: ${account.account_name}`)
      } catch (error) {
        console.error(`❌ Failed to generate report for ${account.account_name}:`, error)
        errorCount++
        results.push({
          account: account.account_name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const response = {
      success: true,
      summary: {
        totalAccounts: accounts.length,
        successCount,
        errorCount,
        periodStart: formatDate(startDate),
        periodEnd: formatDate(endDate),
      },
      results
    }

    console.log('✅ Report generation completed:', response.summary)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Error in generate-report:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
