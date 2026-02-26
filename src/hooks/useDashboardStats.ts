import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';
import { parseToNumber } from '@/lib/utils';

export interface DashboardStats {
  // Ad Accounts
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  totalDailySpend: number;

  // Alerts
  unreadAlerts: number;
  totalAlerts: number;

  // Token Health
  tokensExpiringSoon: number;
  tokensExpired: number;
  healthyTokens: number;

  // Reports
  totalReports: number;
  recentReports: number;

  // Platform breakdown
  metaAccounts: number;
  googleAccounts: number;

  // Accounts with low balance alerts
  accountsWithLowBalance: number;
}

export interface RecentAlert {
  id: string;
  title: string;
  message: string;
  type: string;
  sent_at: string;
  is_read: boolean;
}

export interface AccountSummary {
  id: string;
  account_name: string;
  platform: string;
  balance: string | number;
  daily_spend: string | number;
  status: string;
  token_expires_at: string | null;
}

export function useDashboardStats() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();

      // Fetch ad accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('ad_accounts')
        .select('*');

      if (accountsError) throw accountsError;

      // Fetch alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('id, is_read');

      if (alertsError) throw alertsError;

      // Fetch reports from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('id, created_at');

      if (reportsError) throw reportsError;

      // Calculate stats
      const accountsList = accounts || [];
      const alertsList = alerts || [];
      const reportsList = reports || [];

      // Token health calculation
      let tokensExpiringSoon = 0;
      let tokensExpired = 0;
      let healthyTokens = 0;
      let accountsWithLowBalance = 0;

      accountsList.forEach(account => {
        if (account.token_expires_at) {
          const expiryDate = parseISO(account.token_expires_at);
          const daysUntilExpiry = differenceInDays(expiryDate, now);

          if (daysUntilExpiry < 0) {
            tokensExpired++;
          } else if (daysUntilExpiry <= 7) {
            tokensExpiringSoon++;
          } else {
            healthyTokens++;
          }
        } else {
          healthyTokens++;
        }

        // Check low balance
        if (account.balance !== null && account.min_balance_alert !== null && account.status === 'active' && account.client_id !== null) {
          const balanceNum = parseToNumber(account.balance);
          const minBalance = Number(account.min_balance_alert);
          if (balanceNum <= minBalance) {
            accountsWithLowBalance++;
          }
        }
      });

      // Recent reports (last 7 days)
      const recentReports = reportsList.filter(r => {
        const createdAt = parseISO(r.created_at);
        return differenceInDays(now, createdAt) <= 7;
      }).length;

      const activeLinkedAccounts = accountsList.filter(a => a.status === 'active' && a.client_id !== null);

      return {
        totalAccounts: accountsList.length,
        activeAccounts: accountsList.filter(a => a.status === 'active').length,
        totalBalance: activeLinkedAccounts.reduce((sum, a) => sum + parseToNumber(a.balance), 0),
        totalDailySpend: activeLinkedAccounts.reduce((sum, a) => sum + parseToNumber(a.daily_spend), 0),
        unreadAlerts: alertsList.filter(a => !a.is_read).length,
        totalAlerts: alertsList.length,
        tokensExpiringSoon,
        tokensExpired,
        healthyTokens,
        totalReports: reportsList.length,
        recentReports,
        metaAccounts: accountsList.filter(a => a.platform === 'meta').length,
        googleAccounts: accountsList.filter(a => a.platform === 'google').length,
        accountsWithLowBalance
      };
    }
  });

  const { data: recentAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-recent-alerts'],
    queryFn: async (): Promise<RecentAlert[]> => {
      const { data, error } = await supabase
        .from('alerts')
        .select('id, title, message, type, sent_at, is_read')
        .order('sent_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  const { data: accountsSummary, isLoading: accountsLoading } = useQuery({
    queryKey: ['dashboard-accounts-summary'],
    queryFn: async (): Promise<AccountSummary[]> => {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, account_name, platform, balance, daily_spend, status, token_expires_at')
        .eq('status', 'active')
        .not('client_id', 'is', null)
        .order('balance', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  return {
    stats: stats || {
      totalAccounts: 0,
      activeAccounts: 0,
      totalBalance: 0,
      totalDailySpend: 0,
      unreadAlerts: 0,
      totalAlerts: 0,
      tokensExpiringSoon: 0,
      tokensExpired: 0,
      healthyTokens: 0,
      totalReports: 0,
      recentReports: 0,
      metaAccounts: 0,
      googleAccounts: 0,
      accountsWithLowBalance: 0
    },
    recentAlerts: recentAlerts || [],
    accountsSummary: accountsSummary || [],
    isLoading: statsLoading || alertsLoading || accountsLoading
  };
}
