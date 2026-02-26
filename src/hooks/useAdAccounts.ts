import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Meta campaign objective types
export type MetaCampaignObjective =
  | 'MESSAGES'
  | 'LEADS'
  | 'CONVERSIONS'
  | 'TRAFFIC'
  | 'ENGAGEMENT';

export const CAMPAIGN_OBJECTIVES: { value: MetaCampaignObjective; label: string; metric: string; icon: string }[] = [
  { value: 'MESSAGES', label: 'Mensagens', metric: 'Custo por Mensagem', icon: '💬' },
  { value: 'LEADS', label: 'Leads', metric: 'Custo por Lead', icon: '📋' },
  { value: 'CONVERSIONS', label: 'Conversões', metric: 'Custo por Conversão', icon: '🎯' },
  { value: 'TRAFFIC', label: 'Tráfego', metric: 'Custo por Clique', icon: '🔗' },
  { value: 'ENGAGEMENT', label: 'Engajamento', metric: 'Custo por Engajamento', icon: '👍' },
];

export interface AdAccount {
  id: string;
  user_id: string;
  account_id: string;
  account_name: string;
  platform: 'meta' | 'google';
  email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  balance: number | string;
  daily_spend: number | string;
  min_balance_alert: number;
  alert_enabled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
  report_objectives: MetaCampaignObjective[] | null;
  client_id: string | null;
  is_manager: boolean;
}

export function useAdAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['ad-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdAccount[];
    }
  });

  const deleteAccount = useMutation({
    mutationFn: async (accountId: string) => {
      // Get account details first to delete children if it's a manager
      const { data: account } = await supabase
        .from('ad_accounts')
        .select('user_id, platform, is_manager')
        .eq('id', accountId)
        .single();

      if (account?.is_manager) {
        // Delete child accounts from the same user and platform
        await supabase
          .from('ad_accounts')
          .delete()
          .eq('user_id', account.user_id)
          .eq('platform', account.platform)
          .eq('is_manager', false);
      }

      const { error } = await supabase
        .from('ad_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      toast.success('Conexão removida com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover conexão: ' + error.message);
    }
  });

  const syncAccount = useMutation({
    mutationFn: async (accountId: string) => {
      // Get the account to check its platform
      const { data: account, error: fetchError } = await supabase
        .from('ad_accounts')
        .select('platform')
        .eq('id', accountId)
        .single();

      if (fetchError) throw fetchError;

      // For Google accounts, call the sync edge function
      if (account.platform === 'google') {
        const response = await supabase.functions.invoke('sync-google-balance', {
          body: { accountId }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        return response.data;
      }

      // For Meta accounts, trigger the global sync function
      if (account.platform === 'meta') {
        const response = await supabase.functions.invoke('sync-all-balances');
        if (response.error) throw new Error(response.error.message);
        return response.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (data?.message) {
        toast.success(data.message);
      } else {
        toast.success('Conta sincronizada com sucesso');
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao sincronizar: ' + error.message);
    }
  });

  const syncAllGoogleAccounts = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('sync-google-balance', {
        body: {}
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(data?.message || 'Contas Google Ads sincronizadas');
    },
    onError: (error: any) => {
      toast.error('Erro ao sincronizar: ' + error.message);
    }
  });

  const updateAccountNames = useMutation({
    mutationFn: async () => {
      // Full refresh for Google accounts
      const googleResponse = await supabase.functions.invoke('sync-google-balance', {
        body: { fullRefresh: true }
      });

      // Full refresh for all accounts
      const syncResponse = await supabase.functions.invoke('sync-all-balances');

      if (syncResponse.error) {
        throw new Error(syncResponse.error.message);
      }

      return syncResponse.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      const messages: string[] = [];
      if (data.google?.message) messages.push(data.google.message);
      if (data.meta?.message) messages.push(data.meta.message);

      toast.success(messages.join(' | ') || 'Sincronização completa realizada');
    },
    onError: (error: any) => {
      toast.error('Erro na sincronização: ' + error.message);
    }
  });

  return {
    accounts: accounts || [],
    isLoading,
    error,
    deleteAccount,
    syncAccount,
    syncAllGoogleAccounts,
    updateAccountNames
  };
}

export function useOAuthConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const getRedirectUri = () => {
    return `${window.location.origin}/dashboard/accounts`;
  };

  // Connect Meta via manual token (simpler, no OAuth setup needed)
  const connectMetaToken = async (accessToken: string) => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar logado para conectar uma conta');
      }

      const response = await supabase.functions.invoke('connect-meta-token', {
        body: { accessToken }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      toast.success(response.data?.message || 'Conta conectada com sucesso!');

      return response.data;
    } catch (error: any) {
      console.error('Error connecting Meta via token:', error);
      toast.error(error.message || 'Erro ao conectar Meta Ads');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect Google Ads via manual refresh token
  const connectGoogleToken = async (refreshToken: string, clientId: string, clientSecret: string) => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar logado para conectar uma conta');
      }

      const response = await supabase.functions.invoke('connect-google-token', {
        body: { refreshToken, clientId, clientSecret }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      toast.success(response.data?.message || 'Conta Google Ads conectada com sucesso!');

      return response.data;
    } catch (error: any) {
      console.error('Error connecting Google via token:', error);
      toast.error(error.message || 'Erro ao conectar Google Ads');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectMeta = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para conectar uma conta');
        return;
      }

      const response = await supabase.functions.invoke('oauth-meta', {
        body: {
          action: 'get_auth_url',
          redirectUri: getRedirectUri()
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else if (response.data?.error) {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Error connecting Meta:', error);
      toast.error(error.message || 'Erro ao conectar Meta Ads');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectGoogle = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para conectar uma conta');
        return;
      }

      const response = await supabase.functions.invoke('oauth-google', {
        body: {
          action: 'get_auth_url',
          redirectUri: getRedirectUri()
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else if (response.data?.error) {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Error connecting Google:', error);
      toast.error(error.message || 'Erro ao conectar Google Ads');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string, platform: 'meta' | 'google') => {
    setIsConnecting(true);
    try {
      const functionName = platform === 'meta' ? 'oauth-meta' : 'oauth-google';

      const response = await supabase.functions.invoke(functionName, {
        body: {
          action: 'exchange_code',
          code,
          redirectUri: getRedirectUri()
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
      toast.success(response.data?.message || 'Conta conectada com sucesso!');

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      return response.data;
    } catch (error: any) {
      console.error('Error handling OAuth callback:', error);
      toast.error(error.message || 'Erro ao processar autenticação');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    isConnecting,
    connectMeta,
    connectMetaToken,
    connectGoogle,
    connectGoogleToken,
    handleOAuthCallback
  };
}
