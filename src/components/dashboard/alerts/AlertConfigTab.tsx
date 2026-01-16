import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Bell, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface AdAccountAlert {
  id: string;
  account_name: string;
  platform: string;
  alert_enabled: boolean;
  min_balance_alert: number;
  balance: number;
}

interface AlertConfigTabProps {
  accounts: AdAccountAlert[] | undefined;
  isLoading: boolean;
}

export function AlertConfigTab({ accounts, isLoading }: AlertConfigTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Fetch user's default min balance from notification_settings
  const { data: notificationSettings } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('notification_settings')
        .select('default_min_balance')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const defaultMinBalance = notificationSettings?.default_min_balance || 500;

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

  const handleToggle = (id: string, currentEnabled: boolean) => {
    toggleMutation.mutate({ id, enabled: !currentEnabled });
  };

  const handleEditLimit = (account: AdAccountAlert) => {
    setEditingId(account.id);
    setEditValue(String(account.min_balance_alert || defaultMinBalance));
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

  return (
    <div className="space-y-6">
      {/* Info Card */}
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
          Quando o saldo de uma conta ficar abaixo do limite configurado, você receberá uma notificação. 
          Ative ou desative alertas para cada conta individualmente e ajuste o valor mínimo clicando no limite.
          O limite padrão atual é R$ {defaultMinBalance.toLocaleString("pt-BR")}.
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

        {isLoading ? (
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
                          Limite: R$ {(account.min_balance_alert || defaultMinBalance).toLocaleString("pt-BR")}
                        </button>
                      )}
                    </div>
                    {account.balance !== null && (
                      <p className={`text-xs mt-1 ${
                        (account.balance || 0) < (account.min_balance_alert || defaultMinBalance) 
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
  );
}
