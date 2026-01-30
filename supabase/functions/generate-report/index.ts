import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportData {
  periodDays?: number;
}

interface AdAccount {
  id: string;
  account_id: string;
  account_name: string;
  platform: string;
  access_token: string;
  balance: number;
  daily_spend: number;
  report_objectives: string[] | null;
}

interface MetaInsights {
  spend: number;
  impressions: number;
  clicks: number;
  actions?: Array<{ action_type: string; value: string }>;
}

type CampaignObjective = 'MESSAGES' | 'LEADS' | 'CONVERSIONS' | 'TRAFFIC' | 'ENGAGEMENT';

// Configuration for each objective type
const OBJECTIVE_CONFIG: Record<CampaignObjective, {
  label: string;
  actionTypes: string[];
  metricName: string;
  metricLabel: string;
  emoji: string;
  estimateDivisor: number; // For fallback estimation
}> = {
  MESSAGES: {
    label: 'Mensagens',
    actionTypes: [
      'onsite_conversion.messaging_conversation_started_7d',
      'onsite_conversion.messaging_first_reply',
      'onsite_conversion.messaging_block',
      'contact',
    ],
    metricName: 'mensagens',
    metricLabel: 'Mensagens iniciadas',
    emoji: '💬',
    estimateDivisor: 30, // Avg R$30 per message
  },
  LEADS: {
    label: 'Leads',
    actionTypes: [
      'lead',
      'onsite_conversion.lead_grouped',
      'submit_application',
      'complete_registration',
    ],
    metricName: 'leads',
    metricLabel: 'Leads gerados',
    emoji: '📋',
    estimateDivisor: 50, // Avg R$50 per lead
  },
  CONVERSIONS: {
    label: 'Conversões',
    actionTypes: [
      'purchase',
      'omni_purchase',
      'onsite_conversion.purchase',
      'offsite_conversion.fb_pixel_purchase',
      'add_to_cart',
      'initiate_checkout',
    ],
    metricName: 'conversões',
    metricLabel: 'Conversões realizadas',
    emoji: '🎯',
    estimateDivisor: 100, // Avg R$100 per conversion
  },
  TRAFFIC: {
    label: 'Tráfego',
    actionTypes: [
      'link_click',
      'landing_page_view',
      'outbound_click',
    ],
    metricName: 'cliques',
    metricLabel: 'Cliques no link',
    emoji: '🔗',
    estimateDivisor: 2, // Avg R$2 per click
  },
  ENGAGEMENT: {
    label: 'Engajamento',
    actionTypes: [
      'post_engagement',
      'page_engagement',
      'like',
      'comment',
      'share',
      'video_view',
      'photo_view',
    ],
    metricName: 'engajamentos',
    metricLabel: 'Engajamentos',
    emoji: '👍',
    estimateDivisor: 0.5, // Avg R$0.50 per engagement
  },
};

async function fetchMetaInsights(
  accountId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<MetaInsights | null> {
  try {
    const formatDateForMeta = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const since = formatDateForMeta(startDate);
    const until = formatDateForMeta(endDate);

    console.log(`📊 Fetching insights for account ${accountId} from ${since} to ${until}`);

    // Fetch account insights from Meta API
    const insightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?fields=spend,impressions,clicks,actions&time_range={"since":"${since}","until":"${until}"}&access_token=${accessToken}`;
    
    const response = await fetch(insightsUrl);
    const data = await response.json();

    if (data.error) {
      console.error(`❌ Meta API error for account ${accountId}:`, data.error);
      return null;
    }

    if (!data.data || data.data.length === 0) {
      console.log(`📊 No insights data for account ${accountId} in this period`);
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        actions: []
      };
    }

    const insights = data.data[0];
    console.log(`✅ Got insights for ${accountId}:`, insights);

    return {
      spend: parseFloat(insights.spend || '0'),
      impressions: parseInt(insights.impressions || '0'),
      clicks: parseInt(insights.clicks || '0'),
      actions: insights.actions || []
    };
  } catch (error) {
    console.error(`❌ Error fetching insights for account ${accountId}:`, error);
    return null;
  }
}

function getActionsForObjective(
  actions: Array<{ action_type: string; value: string }> | undefined,
  objective: CampaignObjective
): number {
  if (!actions || actions.length === 0) return 0;

  const config = OBJECTIVE_CONFIG[objective];
  let total = 0;

  for (const action of actions) {
    if (config.actionTypes.includes(action.action_type)) {
      total += parseInt(action.value || '0');
    }
  }

  return total;
}

async function sendWebhookNotifications(supabase: any, report: any, userId: string) {
  try {
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
            objective: report.objective,
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

async function generateReportForObjective(
  supabase: any,
  account: AdAccount,
  userId: string,
  periodDays: number,
  startDate: Date,
  endDate: Date,
  objective: CampaignObjective,
  insights: MetaInsights | null
) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const config = OBJECTIVE_CONFIG[objective];
  const productName = account.account_name;

  let totalInvestment = 0;
  let actionCount = 0;
  let costPerAction = 0;

  if (insights) {
    totalInvestment = insights.spend;
    actionCount = getActionsForObjective(insights.actions, objective);
    
    // If no actions found, estimate based on spend
    if (actionCount === 0 && totalInvestment > 0) {
      actionCount = Math.floor(totalInvestment / config.estimateDivisor);
    }
    
    costPerAction = actionCount > 0 ? totalInvestment / actionCount : 0;
  } else {
    // Fallback for accounts without insights
    const dailySpend = Number(account.daily_spend) || 0;
    totalInvestment = dailySpend * periodDays;
    actionCount = totalInvestment > 0 ? Math.floor(totalInvestment / config.estimateDivisor) : 0;
    costPerAction = actionCount > 0 ? totalInvestment / actionCount : 0;
  }

  const reportMessage = `Bom dia,

Segue o relatório de desempenho da conta de anúncios

Produto: ${productName}

📅 Período analisado: Últimos ${periodDays} dias

💰 Investimento total: R$ ${totalInvestment.toFixed(2).replace('.', ',')}

${config.emoji} ${config.metricLabel}: ${actionCount.toLocaleString('pt-BR')}

📈 Custo por ${config.metricName}: R$ ${costPerAction.toFixed(2).replace('.', ',')}

Vamo pra cima!! 🚀`

  const reportTitle = `📊 ${productName} (${config.label}) - ${formatDate(startDate)} a ${formatDate(endDate)}`

  const reportData = {
    user_id: userId,
    title: reportTitle,
    message: reportMessage,
    product_name: productName,
    period_start: startDate.toISOString().split('T')[0],
    period_end: endDate.toISOString().split('T')[0],
    total_investment: totalInvestment,
    messages_count: actionCount,
    cost_per_message: costPerAction,
    is_read: false,
  }

  const { data: insertedReport, error: insertError } = await supabase
    .from('reports')
    .insert(reportData)
    .select()
    .single()

  if (insertError) {
    console.error(`❌ Error creating report for ${productName} (${objective}):`, insertError)
    throw insertError
  }

  console.log(`✅ Report created for: ${productName} (${objective}) - Investment: R$ ${totalInvestment.toFixed(2)}, ${config.metricName}: ${actionCount}`)

  await sendWebhookNotifications(supabase, { ...insertedReport, objective }, userId)

  return {
    account: productName,
    objective,
    report: insertedReport,
    stats: {
      totalInvestment,
      actionCount,
      costPerAction,
    }
  }
}

async function generateReportsForAccount(
  supabase: any,
  account: AdAccount,
  userId: string,
  periodDays: number,
  startDate: Date,
  endDate: Date
) {
  // Get objectives for this account (default to MESSAGES if not set)
  const objectives = (account.report_objectives || ['MESSAGES']) as CampaignObjective[];
  
  console.log(`📊 Generating ${objectives.length} report(s) for ${account.account_name}: ${objectives.join(', ')}`);

  // Fetch insights once for all objectives
  let insights: MetaInsights | null = null;
  
  if (account.platform === 'meta' && account.access_token) {
    insights = await fetchMetaInsights(
      account.account_id,
      account.access_token,
      startDate,
      endDate
    );
  }

  const results = [];

  // Generate a report for each selected objective
  for (const objective of objectives) {
    try {
      const result = await generateReportForObjective(
        supabase,
        account,
        userId,
        periodDays,
        startDate,
        endDate,
        objective,
        insights
      );
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to generate ${objective} report for ${account.account_name}:`, error);
      results.push({
        account: account.account_name,
        objective,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📊 Starting report generation...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    let requestData: ReportData = {}
    try {
      requestData = await req.json()
    } catch {
      // Use defaults if no body
    }

    const periodDays = requestData.periodDays || 7

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    // Fetch all ad accounts for this user with access_token
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id, account_id, account_name, platform, access_token, balance, daily_spend, report_objectives')
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

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const account of accounts) {
      try {
        const accountResults = await generateReportsForAccount(
          supabase,
          account,
          user.id,
          periodDays,
          startDate,
          endDate
        )
        
        for (const result of accountResults) {
          results.push(result)
          if ('error' in result) {
            errorCount++
          } else {
            successCount++
          }
        }
        
        console.log(`✅ ${accountResults.length} report(s) generated for: ${account.account_name}`)
      } catch (error) {
        console.error(`❌ Failed to generate reports for ${account.account_name}:`, error)
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
        totalReports: successCount + errorCount,
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