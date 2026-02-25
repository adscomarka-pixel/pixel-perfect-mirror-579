import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportData {
  periodDays?: number;
  accountId?: string;
}

interface AdAccount {
  id: string;
  account_id: string;
  account_name: string;
  platform: string;
  access_token: string;
  refresh_token: string | null;
  balance: string | number;
  daily_spend: string | number;
  report_objectives: string[] | null;
}

interface MetaInsights {
  spend: number;
  impressions: number;
  clicks: number;
  actions?: Array<{ action_type: string; value: string }>;
  raw?: any;
}

interface GoogleAdsInsights {
  spend: number;
  clicks: number;
  conversions: number;
  impressions: number;
}

type CampaignObjective = 'MESSAGES' | 'LEADS' | 'CONVERSIONS' | 'TRAFFIC' | 'ENGAGEMENT';

// LISTAS DE PRIORIDADE (Ordenadas do evento mais valioso para o genérico)
const OBJECTIVE_CONFIG: Record<CampaignObjective, {
  label: string;
  actionTypes: string[];
  metricName: string;
  metricLabel: string;
  emoji: string;
  estimateDivisor: number; 
  googleMetric: 'conversions' | 'clicks'; 
}> = {
  MESSAGES: {
    label: 'Mensagens',
    actionTypes: [
      'onsite_conversion.messaging_conversation_started_7d',
    ],
    metricName: 'mensagens',
    metricLabel: 'Mensagens iniciadas',
    emoji: '💬',
    estimateDivisor: 30, 
    googleMetric: 'conversions',
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
    estimateDivisor: 50, 
    googleMetric: 'conversions',
  },
  CONVERSIONS: {
    label: 'Conversões',
    actionTypes: [
      'purchase',
      'offsite_conversion.fb_pixel_purchase',
      'onsite_conversion.purchase',
      'omni_purchase',
      'add_to_cart',
      'initiate_checkout',
    ],
    metricName: 'conversões',
    metricLabel: 'Conversões realizadas',
    emoji: '🎯',
    estimateDivisor: 100, 
    googleMetric: 'conversions',
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
    estimateDivisor: 2, 
    googleMetric: 'clicks',
  },
  ENGAGEMENT: {
    label: 'Engajamento',
    actionTypes: [
      'post_engagement',
      'page_engagement',
      'post_reaction',
      'like',
      'comment',
      'share',
      'video_view',
    ],
    metricName: 'engajamentos',
    metricLabel: 'Engajamentos',
    emoji: '👍',
    estimateDivisor: 0.5, 
    googleMetric: 'clicks',
  },
};

// Converte valores formatados do banco ("150,00") para número
function parseToNumber(value: any): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const str = String(value);
  if (str.includes(',')) {
    const cleanStr = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  }
  return parseFloat(str) || 0;
}

async function refreshGoogleAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
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
    if (tokenData.error) return null
    return tokenData.access_token
  } catch (error) {
    return null
  }
}

async function fetchGoogleAdsInsights(
  account: AdAccount,
  startDate: Date,
  endDate: Date
): Promise<GoogleAdsInsights | null> {
  try {
    const developerToken = Deno.env.get('GOOGLE_DEVELOPER_TOKEN')
    if (!developerToken) return null

    const refreshTokenData = account.refresh_token || ''
    const parts = refreshTokenData.split('|')
    const refreshToken = parts[0]
    const clientId = parts[1]
    const clientSecret = parts[2]
    const mccId = parts[3]

    if (!refreshToken || !clientId || !clientSecret) return null

    const accessToken = await refreshGoogleAccessToken(refreshToken, clientId, clientSecret)
    if (!accessToken) return null

    const formatDateForGoogle = (date: Date) => date.toISOString().split('T')[0]
    const since = formatDateForGoogle(startDate)
    const until = formatDateForGoogle(endDate)

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    }

    if (mccId && mccId !== account.account_id) {
      headers['login-customer-id'] = mccId
    }

    const query = `
      SELECT
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions
      FROM customer
      WHERE segments.date BETWEEN '${since}' AND '${until}'
    `

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${account.account_id}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: query.trim() })
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    let totalSpend = 0
    let totalClicks = 0
    let totalImpressions = 0
    let totalConversions = 0

    if (data && Array.isArray(data)) {
      for (const batch of data) {
        if (batch.results) {
          for (const result of batch.results) {
            if (result.metrics) {
              totalSpend += (parseInt(result.metrics.costMicros || '0') / 1000000)
              totalClicks += parseInt(result.metrics.clicks || '0')
              totalImpressions += parseInt(result.metrics.impressions || '0')
              totalConversions += parseFloat(result.metrics.conversions || '0')
            }
          }
        }
      }
    }

    return {
      spend: totalSpend,
      clicks: totalClicks,
      impressions: totalImpressions,
      conversions: Math.round(totalConversions),
    }
  } catch (error) {
    return null
  }
}

async function fetchMetaInsights(
  accountId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<MetaInsights | null> {
  try {
    const formatDateForMeta = (date: Date) => {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    };

    const since = formatDateForMeta(startDate);
    const until = formatDateForMeta(endDate);

    console.log(`📊 Fetching Meta insights for account ${accountId} from ${since} to ${until}`);

    const params = new URLSearchParams({
      fields: 'spend,impressions,clicks,actions',
      time_range: JSON.stringify({ since, until }),
      access_token: accessToken
    });

    const insightsUrl = `https://graph.facebook.com/v21.0/act_${accountId}/insights?${params.toString()}`;

    const response = await fetch(insightsUrl);
    const data = await response.json();

    if (data.error) {
      console.error(`❌ Meta API error for account ${accountId}:`, data.error);
      return { spend: 0, impressions: 0, clicks: 0, actions: [], raw: data };
    }

    if (!data.data || data.data.length === 0) {
      console.log(`📊 No insights data for account ${accountId} in this period`);
      return { spend: 0, impressions: 0, clicks: 0, actions: [], raw: data };
    }

    const insights = data.data[0];
    return {
      spend: parseFloat(insights.spend || '0'),
      impressions: parseInt(insights.impressions || '0'),
      clicks: parseInt(insights.clicks || '0'),
      actions: insights.actions || [],
      raw: data
    };
  } catch (error) {
    console.error(`❌ Error fetching Meta insights for account ${accountId}:`, error);
    return { spend: 0, impressions: 0, clicks: 0, actions: [], raw: String(error) };
  }
}

function getActionsForObjective(
  actions: Array<{ action_type: string; value: string }> | undefined,
  objective: CampaignObjective
): number {
  if (!actions || actions.length === 0) return 0;

  const config = OBJECTIVE_CONFIG[objective];

  // A MÁGICA ACONTECE AQUI:
  // Em vez de somar tudo e duplicar os resultados, a função procura 
  // do mais importante pro menos importante. Achou? Retorna e ignora o resto.
  for (const targetType of config.actionTypes) {
    const foundAction = actions.find(a => a.action_type === targetType);
    
    if (foundAction) {
      return parseInt(foundAction.value || '0');
    }
  }

  return 0; // Se não encontrou nenhuma ação relevante
}

async function sendWebhookNotifications(supabase: any, report: any, userId: string) {
  try {
    const { data: webhooks, error } = await supabase
      .from('webhook_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error || !webhooks || webhooks.length === 0) return

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

        await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
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
  metaInsights: MetaInsights | null,
  googleInsights: GoogleAdsInsights | null
) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const config = OBJECTIVE_CONFIG[objective];
  const productName = account.account_name;

  let totalInvestment = 0;
  let actionCount = 0;
  let costPerAction = 0;

  if (account.platform === 'google' && googleInsights) {
    totalInvestment = googleInsights.spend;
    if (config.googleMetric === 'conversions') {
      actionCount = googleInsights.conversions;
    } else {
      actionCount = googleInsights.clicks;
    }
    if (actionCount === 0 && totalInvestment > 0) {
      actionCount = Math.floor(totalInvestment / config.estimateDivisor);
    }
    costPerAction = actionCount > 0 ? totalInvestment / actionCount : 0;
  } else if (account.platform === 'meta' && metaInsights) {
    totalInvestment = metaInsights.spend;
    
    // Passamos direto para a nova função que prioriza os eventos!
    actionCount = getActionsForObjective(metaInsights.actions, objective);

    if (actionCount === 0 && totalInvestment > 0) {
      actionCount = Math.floor(totalInvestment / config.estimateDivisor);
    }
    costPerAction = actionCount > 0 ? totalInvestment / actionCount : 0;
  } else {
    const dailySpend = parseToNumber(account.daily_spend);
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
  const objectives = (account.report_objectives || ['MESSAGES']) as CampaignObjective[];
  let metaInsights: MetaInsights | null = null;
  let googleInsights: GoogleAdsInsights | null = null;

  if (account.platform === 'meta' && account.access_token) {
    metaInsights = await fetchMetaInsights(
      account.account_id,
      account.access_token,
      startDate,
      endDate
    );
  } else if (account.platform === 'google' && account.refresh_token) {
    googleInsights = await fetchGoogleAdsInsights(
      account,
      startDate,
      endDate
    );
  }

  const results = [];

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
        metaInsights,
        googleInsights
      );
      results.push(result);
    } catch (error) {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) throw new Error('Invalid user token')

    let requestData: ReportData = {}
    try {
      requestData = await req.json()
    } catch {}

    const periodDays = requestData.periodDays || 7
    const accountId = requestData.accountId 

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    let accountsQuery = supabase
      .from('ad_accounts')
      .select('id, account_id, account_name, platform, access_token, refresh_token, balance, daily_spend, report_objectives')
      .eq('user_id', user.id)

    if (accountId) {
      accountsQuery = accountsQuery.eq('id', accountId)
    }

    const { data: accounts, error: accountsError } = await accountsQuery

    if (accountsError) throw accountsError

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: accountId ? 'Conta de anúncios não encontrada' : 'Nenhuma conta de anúncios encontrada'
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
      } catch (error) {
        errorCount++
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

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})