import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlayCircle, RefreshCw, Settings2, Bell, Webhook } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertConfigTab } from "@/components/dashboard/alerts/AlertConfigTab";
import { NotificationsTab } from "@/components/dashboard/alerts/NotificationsTab";
import { IntegrationsTab } from "@/components/dashboard/alerts/IntegrationsTab";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

interface AdAccountAlert {
  id: string;
  account_name: string;
  platform: string;
  alert_enabled: boolean;
  min_balance_alert: number;
  balance: number | string;
}

const Alerts = () => {
  const queryClient = useQueryClient();

  // Fetch ad accounts with alert settings
  const { data: accounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['ad-accounts-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, account_name, platform, alert_enabled, min_balance_alert, balance')
        .order('account_name');

      if (error) throw error;
      return data as AdAccountAlert[];
    }
  });

  // Manual balance check mutation
  const checkBalanceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-balance-alerts');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['notification-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      if (data.alertsCreated > 0) {
        toast.success(`${data.alertsCreated} alerta(s) criado(s) para: ${data.alertedAccounts.join(', ')}`);
      } else {
        toast.info(`${data.accountsChecked} conta(s) verificada(s). Nenhum saldo abaixo do limite.`);
      }
    },
    onError: (error) => {
      toast.error('Erro ao verificar saldos: ' + error.message);
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['ad-accounts-alerts'] }),
        queryClient.refetchQueries({ queryKey: ['all-alerts'] }),
        queryClient.refetchQueries({ queryKey: ['notification-alerts'] }),
        queryClient.refetchQueries({ queryKey: ['unread-alerts-count'] }),
        queryClient.refetchQueries({ queryKey: ['webhook-integrations'] }),
      ]);
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
            <p className="text-muted-foreground">Gerencie notificações e integrações</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="default"
            onClick={() => checkBalanceMutation.mutate()}
            disabled={checkBalanceMutation.isPending}
          >
            {checkBalanceMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            Testar Verificação
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="config" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Webhook className="w-4 h-4" />
            Integrações (n8n)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <AlertConfigTab accounts={accounts} isLoading={loadingAccounts} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Alerts;
