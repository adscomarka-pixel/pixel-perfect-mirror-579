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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const metaAppId = Deno.env.get('META_APP_ID')
    const metaAppSecret = Deno.env.get('META_APP_SECRET')

    if (!metaAppId || !metaAppSecret) {
      return new Response(
        JSON.stringify({ error: 'Meta App credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, code, redirectUri } = await req.json()

    if (action === 'get_auth_url') {
      const scope = 'ads_management,ads_read,business_management'
      // Use state parameter for CSRF protection and to pass platform info
      const state = crypto.randomUUID()
      const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`

      console.log('Meta OAuth URL generated:', authUrl)
      console.log('Redirect URI:', redirectUri)

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'exchange_code') {
      // Exchange code for access token
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${metaAppId}&client_secret=${metaAppSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`

      const tokenResponse = await fetch(tokenUrl)
      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get long-lived token
      const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${tokenData.access_token}`

      const longLivedResponse = await fetch(longLivedUrl)
      const longLivedData = await longLivedResponse.json()

      const accessToken = longLivedData.access_token || tokenData.access_token
      const expiresIn = longLivedData.expires_in || 3600

      // Get user info and ad accounts
      const meResponse = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`)
      const meData = await meResponse.json()

      const adAccountsFields = 'id,name,account_status,balance,available_balance,spend_cap,amount_spent,is_prepay_account,extended_credit_invoice_group{id,balance,max_allotted_spending_limit,auto_rollover_limit},funding_source_details{amount_available,type,display_name,display_string},business{id,funding_lines{id,balance,amount,status,currency,display_balance}}'
      const adAccountsResponse = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=${adAccountsFields}&access_token=${accessToken}`)
      const adAccountsData = await adAccountsResponse.json()

      console.log('Ad accounts data received')

      if (adAccountsData.error) {
        console.error('Meta API error:', adAccountsData.error)
        throw new Error(adAccountsData.error.message)
      }

      if (!adAccountsData.data || adAccountsData.data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No ad accounts found for this user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create/Update Manager entry for the whole connection
      const managerAccountId = `meta_user_${meData.id}`
      const managerAccountData = {
        user_id: user.id,
        account_id: managerAccountId,
        account_name: `Meta - ${meData.name}`,
        platform: 'meta',
        email: meData.email,
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        status: 'active',
        is_manager: true,
        last_sync_at: new Date().toISOString()
      }

      await supabase
        .from('ad_accounts')
        .upsert(managerAccountData, { onConflict: 'user_id,account_id,platform' })

      // Save ad accounts to database
      const savedAccounts = []
      for (const account of adAccountsData.data) {
        const account_id = account.id.replace('act_', '')

        // SMART BALANCE CALCULATION
        let balanceValue = 0;
        const isPrepay = account.is_prepay_account === true || account.is_prepay_account === 'true' || account.is_prepay_account === 1;
        const rawBalance = account.balance ? parseFloat(account.balance) / 100 : 0
        const rawAvailable = account.available_balance ? parseFloat(account.available_balance) / 100 : 0
        const spendCap = account.spend_cap ? parseFloat(account.spend_cap) / 100 : 0
        const amountSpent = account.amount_spent ? parseFloat(account.amount_spent) / 100 : 0
        const creditLineBalance = account.extended_credit_invoice_group?.balance ? parseFloat(account.extended_credit_invoice_group.balance) / 100 : 0
        const creditLineLimit = account.extended_credit_invoice_group?.max_allotted_spending_limit ? parseFloat(account.extended_credit_invoice_group.max_allotted_spending_limit) / 100 : 0
        const fundingAvailable = account.funding_source_details?.amount_available ? parseFloat(account.funding_source_details.amount_available) / 100 : 0

        // Check if account has a business funding line balance
        let businessFundingBalance = 0;
        if (account.business?.funding_lines?.data) {
          const activeLine = account.business.funding_lines.data.find((f: any) => f.status === 1 || f.status === 'ACTIVE');
          if (activeLine && activeLine.balance) {
            businessFundingBalance = parseFloat(activeLine.balance) / 100;
          }
        }

        // Extract balance from display_string if available (highest priority for prepay)
        let displayStringValue = 0;
        if (account.funding_source_details?.display_string) {
          const match = account.funding_source_details.display_string.match(/R\$\s*([\d.,]+)/);
          if (match && match[1]) {
            let valStr = match[1].replace(/\./g, '').replace(',', '.');
            displayStringValue = parseFloat(valStr);
          }
        }

        if (isPrepay) {
          // STRICT PRIORITY FOR PREPAID:
          if (displayStringValue > 0) {
            balanceValue = displayStringValue;
          } else if (fundingAvailable > 0) {
            balanceValue = fundingAvailable;
          } else if (rawAvailable > 0) {
            balanceValue = rawAvailable;
          } else if (businessFundingBalance > 0) {
            balanceValue = businessFundingBalance;
          } else if (creditLineLimit > 0) {
            balanceValue = Math.max(0, creditLineLimit - amountSpent);
          } else if (spendCap > 0) {
            balanceValue = Math.max(0, spendCap - amountSpent);
          } else if (rawBalance < 0) {
            balanceValue = Math.abs(rawBalance);
          } else {
            balanceValue = 0;
          }
        } else {
          // PRIORITY FOR POST-PAID (Credit Card/Invoice):
          if (businessFundingBalance > 0) {
            balanceValue = businessFundingBalance;
          } else if (rawAvailable > 0) {
            balanceValue = rawAvailable;
          } else if (creditLineBalance > 0) {
            balanceValue = creditLineBalance;
          } else if (creditLineLimit > 0) {
            balanceValue = Math.max(0, creditLineLimit - amountSpent);
          } else if (spendCap > 0) {
            balanceValue = Math.max(0, spendCap - amountSpent);
          } else if (rawBalance < 0) {
            balanceValue = Math.abs(rawBalance);
          } else {
            balanceValue = 0;
          }
        }

        console.log(`Syncing Meta ${account_id}: prepay=${isPrepay}, avail=${rawAvailable}, fund=${fundingAvailable}, bal=${rawBalance}, cap=${spendCap}, spent=${amountSpent} => Final=${balanceValue}`)

        // Check if account already exists to preserve client_id and manual configs
        const { data: existingAccount } = await supabase
          .from('ad_accounts')
          .select('id, client_id, min_balance_alert, alert_enabled')
          .eq('user_id', user.id)
          .eq('account_id', account_id)
          .eq('platform', 'meta')
          .maybeSingle()

        const accountData = {
          user_id: user.id,
          account_id: account_id,
          account_name: account.name,
          platform: 'meta',
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          status: account.account_status === 1 ? 'active' : 'inactive',
          balance: balanceValue,
          spend_cap: account.spend_cap ? parseFloat(account.spend_cap) / 100 : null,
          last_sync_at: new Date().toISOString(),
          is_manager: false
        }
        let savedAccount, saveError

        if (existingAccount) {
          // Update existing account (preserves client_id and manual configs)
          const { data, error } = await supabase
            .from('ad_accounts')
            .update(accountData)
            .eq('id', existingAccount.id)
            .select()
            .single()
          savedAccount = data
          saveError = error
        } else {
          // Insert new account
          const { data, error } = await supabase
            .from('ad_accounts')
            .insert(accountData)
            .select()
            .single()
          savedAccount = data
          saveError = error
        }

        if (!saveError && savedAccount) {
          savedAccounts.push(savedAccount)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          accounts: savedAccounts,
          message: `Connected ${savedAccounts.length} Meta ad account(s)`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
