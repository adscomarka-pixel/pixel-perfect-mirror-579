import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Falta cabeçalho de autorização' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    let payload;
    try {
      payload = await req.json()
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const accessToken = payload.accessToken
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Token da Meta é obrigatório' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 1. Validar usuário na Meta (usar v21.0 - a mais estável)
    console.log(`🚀 Iniciando conexão Meta para usuário: ${user.id}`)
    const meResponse = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`)
    
    if (!meResponse.ok) {
        const errorData = await meResponse.json().catch(() => ({ message: 'Erro na autenticação Meta' }))
        return new Response(JSON.stringify({ error: `Meta Auth: ${errorData.error?.message || errorData.message}` }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
    }
    
    const meData = await meResponse.json()
    console.log(`✅ Usuário Meta: ${meData.name}`)

    // 2. Salvar o Gestor Primeiro (Critical)
    const managerAccountId = `meta_token_${meData.id}`
    const { error: managerError } = await supabase
      .from('ad_accounts')
      .upsert({
        user_id: user.id,
        account_id: managerAccountId,
        account_name: `Meta - ${meData.name} (Token)`,
        platform: 'meta',
        email: meData.email || null,
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        is_manager: true,
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,account_id,platform'
      })

    if (managerError) {
        console.error('❌ Erro gravando Gestor:', managerError)
        return new Response(JSON.stringify({ error: `Erro no Banco: ${managerError.message}` }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
    }

    // 3. Buscar contas de anúncio (Removido 'insights' para ser mais rápido e evitar timeouts)
    let allAdAccounts = []
    const fields = "id,name,account_status,balance,available_balance,spend_cap,amount_spent,is_prepay_account,funding_source_details{amount_available,type,display_name,display_string}"
    let nextUrl = `https://graph.facebook.com/v21.0/me/adaccounts?fields=${fields}&limit=50&access_token=${accessToken}`

    // Limitamos a busca a no máximo 10 batches para evitar loops infinitos acidentais, mas 139 contas cabem em 3 batches
    let safetyCounter = 0
    while (nextUrl && safetyCounter < 20) {
      safetyCounter++
      const response = await fetch(nextUrl)
      if (!response.ok) break
      const result = await response.json()
      if (result.data) {
        allAdAccounts = [...allAdAccounts, ...result.data]
      }
      nextUrl = result.paging?.next || null
    }

    console.log(`📦 Processando ${allAdAccounts.length} sub-contas...`)

    // 4. Gravação Otimizada
    if (allAdAccounts.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < allAdAccounts.length; i += batchSize) {
          const chunk = allAdAccounts.slice(i, i + batchSize).map(account => {
            const accId = account.id.replace('act_', '')
            
            // Lógica Simplificada para Conexão Inicial
            let balance = 0;
            const isPrepay = account.is_prepay_account === true || account.is_prepay_account === 'true' || account.is_prepay_account === 1;
            
            // Tenta display_string primeiro se for prepay
            if (isPrepay && account.funding_source_details?.display_string) {
                const ds = account.funding_source_details.display_string;
                const match = ds.match(/R\$\s*([\d\.,]+)/) || ds.match(/[\d\.,]+/g);
                if (match) {
                    const val = (Array.isArray(match) ? (match[1] || match[0]) : match).replace(/\./g, '').replace(',', '.');
                    balance = parseFloat(val);
                }
            } else {
                balance = account.available_balance ? parseFloat(account.available_balance) / 100 : 
                          (account.balance ? Math.abs(parseFloat(account.balance) / 100) : 0);
            }

            return {
              user_id: user.id,
              account_id: accId,
              account_name: account.name || `Conta ${accId}`,
              platform: 'meta',
              email: meData.email || null,
              access_token: accessToken,
              token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              balance: balance.toFixed(2).replace('.', ','),
              status: account.account_status === 1 ? 'active' : 'disconnected',
              is_manager: false,
              last_sync_at: new Date().toISOString()
            }
          });

          await supabase
            .from('ad_accounts')
            .upsert(chunk, { onConflict: 'user_id,account_id,platform' })
        }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Canais conectados com sucesso! ${allAdAccounts.length} contas configuradas.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('❌ Falha Crítica:', err)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})