import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Bell, CheckCircle2, Loader2, MessageSquare, PlayCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdAccountAlert {
  id: string;
  account_name: string;
  platform: string;
  alert_enabled: boolean;
  min_balance_alert: number;
  balance: number;
}

const Alerts = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

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

  // Fetch recent alerts from database
  const { data: recentAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['recent-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Toggle alert mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('ad_accounts')
        .update({ alert_enabled: enabled })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-accounts-alerts'] });
      toast.success('Configuração atualizada');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Update min balance mutation
  const updateMinBalanceMutation = useMutation({
    mutationFn: async ({ id, minBalance }: { id: string; minBalance: number }) => {
      const { error } = await supabase
        .from('ad_accounts')
        .update({ min_balance_alert: minBalance })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-accounts-alerts'] });
      toast.success('Limite atualizado');
      setEditingId(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['recent-alerts'] });
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

  const handleToggle = (id: string, currentEnabled: boolean) => {
    toggleMutation.mutate({ id, enabled: !currentEnabled });
  };

  const handleEditLimit = (account: AdAccountAlert) => {
    setEditingId(account.id);
    setEditValue(String(account.min_balance_alert || 500));
  };

  const handleSaveLimit = (id: string) => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      toast.error('Valor inválido');
      return;
    }
    updateMinBalanceMutation.mutate({ id, minBalance: value });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const formatAlertTime = (sentAt: string) => {
    return formatDistanceToNow(new Date(sentAt), { addSuffix: true, locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
            <p className="text-muted-foreground">Configure alertas de saldo baixo para suas contas</p>
          </div>
          <div className="flex gap-2">
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['ad-accounts-alerts', 'recent-alerts'] })}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alert Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Channels Info */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Como funcionam os alertas</h3>
                  <p className="text-sm text-muted-foreground">Configure limites mínimos para cada conta</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Quando o saldo de uma conta ficar abaixo do limite configurado, você receberá um alerta. 
                Ative ou desative alertas para cada conta individualmente e ajuste o valor mínimo clicando no limite.
              </p>
            </div>

            {/* Alert Rules */}
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Regras de Alerta por Conta</h3>
                <span className="text-sm text-muted-foreground">
                  {accounts?.filter(a => a.alert_enabled).length || 0} ativas
                </span>
              </div>

              {loadingAccounts ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Carregando contas...</p>
                </div>
              ) : !accounts || accounts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhuma conta conectada.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conecte uma conta para configurar alertas.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {accounts.map((account) => (
                    <div key={account.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          account.alert_enabled ? "bg-warning/10" : "bg-muted"
                        }`}>
                          <Bell className={`w-5 h-5 ${
                            account.alert_enabled ? "text-warning" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{account.account_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{account.platform === "meta" ? "Meta Ads" : "Google Ads"}</span>
                            <span>•</span>
                            {editingId === account.id ? (
                              <div className="flex items-center gap-2">
                                <span>Limite: R$</span>
                                <Input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-24 h-7 text-sm"
                                  autoFocus
                                />
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 px-2"
                                  onClick={() => handleSaveLimit(account.id)}
                                  disabled={updateMinBalanceMutation.isPending}
                                >
                                  {updateMinBalanceMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 text-success" />
                                  )}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 px-2"
                                  onClick={handleCancelEdit}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleEditLimit(account)}
                                className="hover:text-foreground hover:underline transition-colors"
                              >
                                Limite: R$ {(account.min_balance_alert || 500).toLocaleString("pt-BR")}
                              </button>
                            )}
                          </div>
                          {account.balance !== null && (
                            <p className={`text-xs mt-1 ${
                              (account.balance || 0) < (account.min_balance_alert || 500) 
                                ? 'text-destructive' 
                                : 'text-success'
                            }`}>
                              Saldo atual: R$ {(account.balance || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={account.alert_enabled || false}
                        onCheckedChange={() => handleToggle(account.id, account.alert_enabled || false)}
                        disabled={toggleMutation.isPending}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Alertas Recentes</h3>
              </div>

              {loadingAlerts ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : !recentAlerts || recentAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum alerta enviado ainda.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          alert.type === "warning" || alert.type === "low_balance" 
                            ? "bg-warning/10" 
                            : alert.type === "critical" 
                            ? "bg-destructive/10"
                            : "bg-success/10"
                        }`}>
                          {alert.type === "warning" || alert.type === "low_balance" || alert.type === "critical" ? (
                            <AlertTriangle className={`w-4 h-4 ${
                              alert.type === "critical" ? "text-destructive" : "text-warning"
                            }`} />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatAlertTime(alert.sent_at)}
                            </span>
                            {!alert.is_read && (
                              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-accent/10 text-accent">
                                Novo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Alerts;
