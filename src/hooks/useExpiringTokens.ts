import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';

export interface ExpiringToken {
  id: string;
  account_name: string;
  platform: 'meta' | 'google';
  token_expires_at: string;
  daysUntilExpiry: number;
  status: 'critical' | 'warning' | 'expiring_soon' | 'healthy';
}

export function useExpiringTokens(showAll: boolean = false) {
  const { data: expiringTokens, isLoading, refetch } = useQuery({
    queryKey: ['expiring-tokens', showAll],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, account_name, platform, token_expires_at')
        .not('token_expires_at', 'is', null)
        .order('token_expires_at', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const tokens: ExpiringToken[] = [];

      for (const account of data || []) {
        if (!account.token_expires_at) continue;

        const expiryDate = parseISO(account.token_expires_at);
        const daysUntilExpiry = differenceInDays(expiryDate, now);

        let status: ExpiringToken['status'];
        
        if (daysUntilExpiry <= 0) {
          status = 'critical';
        } else if (daysUntilExpiry <= 3) {
          status = 'critical';
        } else if (daysUntilExpiry <= 7) {
          status = 'warning';
        } else if (daysUntilExpiry <= 14) {
          status = 'expiring_soon';
        } else {
          status = 'healthy';
        }

        // If showAll, include all tokens; otherwise only include expiring ones
        if (showAll || daysUntilExpiry <= 14) {
          tokens.push({
            id: account.id,
            account_name: account.account_name,
            platform: account.platform as 'meta' | 'google',
            token_expires_at: account.token_expires_at,
            daysUntilExpiry,
            status,
          });
        }
      }

      return tokens;
    },
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });

  const criticalCount = expiringTokens?.filter(t => t.status === 'critical').length || 0;
  const warningCount = expiringTokens?.filter(t => t.status === 'warning').length || 0;
  const expiringSoonCount = expiringTokens?.filter(t => t.status === 'expiring_soon').length || 0;

  return {
    expiringTokens: expiringTokens || [],
    isLoading,
    refetch,
    criticalCount,
    warningCount,
    expiringSoonCount,
    hasExpiringTokens: (expiringTokens?.length || 0) > 0,
  };
}
