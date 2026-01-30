import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { type AdAccount, type MetaCampaignObjective, CAMPAIGN_OBJECTIVES } from "@/hooks/useAdAccounts";

interface AccountConfigDialogProps {
  account: AdAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountConfigDialog({ account, open, onOpenChange }: AccountConfigDialogProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [accountName, setAccountName] = useState("");
  const [minBalanceAlert, setMinBalanceAlert] = useState(500);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [reportObjectives, setReportObjectives] = useState<MetaCampaignObjective[]>(['MESSAGES']);
  
  // Reset form when account changes
  useEffect(() => {
    if (account) {
      setAccountName(account.account_name);
      setMinBalanceAlert(account.min_balance_alert || 500);
      setAlertEnabled(account.alert_enabled ?? true);
      setReportObjectives(account.report_objectives || ['MESSAGES']);
    }
  }, [account]);

  const toggleObjective = (objective: MetaCampaignObjective) => {
    setReportObjectives(prev => {
      if (prev.includes(objective)) {
        // Don't allow removing the last objective
        if (prev.length === 1) {
          toast.error("Selecione pelo menos um objetivo de campanha");
          return prev;
        }
        return prev.filter(o => o !== objective);
      }
      return [...prev, objective];
    });
  };

  const handleSave = async () => {
    if (!account) return;
    
    if (reportObjectives.length === 0) {
      toast.error("Selecione pelo menos um objetivo de campanha");
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ad_accounts")
        .update({
          account_name: accountName,
          min_balance_alert: minBalanceAlert,
          alert_enabled: alertEnabled,
          report_objectives: reportObjectives,
        })
        .eq("id", account.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["ad-accounts"] });
      toast.success("Configurações salvas com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving account config:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateDaysRemaining = (balance: number, dailySpend: number) => {
    if (dailySpend === 0) return "∞";
    return Math.floor(balance / dailySpend);
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              account.platform === "meta" ? "bg-[#1877F2]/10" : "bg-[#4285F4]/10"
            }`}>
              {account.platform === "meta" ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </div>
            Configurar Conta
          </DialogTitle>
          <DialogDescription>
            Configure as opções de monitoramento e alertas para esta conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(account.balance || 0)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Gasto/Dia</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(account.daily_spend || 0)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Dias Restantes</p>
              <p className="text-lg font-semibold text-foreground">
                {calculateDaysRemaining(account.balance || 0, account.daily_spend || 0)}
              </p>
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="account-name">Nome da Conta</Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Nome para identificar a conta"
            />
            <p className="text-xs text-muted-foreground">
              Use um nome amigável para identificar esta conta nos relatórios
            </p>
          </div>

          {/* Alert Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="alert-enabled">Alertas de Saldo</Label>
                <p className="text-xs text-muted-foreground">
                  Receba notificações quando o saldo estiver baixo
                </p>
              </div>
              <Switch
                id="alert-enabled"
                checked={alertEnabled}
                onCheckedChange={setAlertEnabled}
              />
            </div>

            {alertEnabled && (
              <div className="space-y-2">
                <Label htmlFor="min-balance">Saldo Mínimo para Alerta</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    id="min-balance"
                    type="number"
                    value={minBalanceAlert}
                    onChange={(e) => setMinBalanceAlert(Number(e.target.value))}
                    className="pl-10"
                    min={0}
                    step={50}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Você será alertado quando o saldo ficar abaixo de {formatCurrency(minBalanceAlert)}
                </p>
              </div>
            )}
          </div>

          {/* Campaign Objectives - Only for Meta accounts */}
          {account.platform === "meta" && (
            <div className="space-y-3">
              <div>
                <Label>Objetivos de Campanha para Relatórios</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione os objetivos. Um relatório será gerado para cada objetivo selecionado.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CAMPAIGN_OBJECTIVES.map((objective) => (
                  <div
                    key={objective.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      reportObjectives.includes(objective.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                    onClick={() => toggleObjective(objective.value)}
                  >
                    <Checkbox
                      checked={reportObjectives.includes(objective.value)}
                      onCheckedChange={() => toggleObjective(objective.value)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1">
                      <span className="text-lg mr-2">{objective.icon}</span>
                      <span className="text-sm font-medium">{objective.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              {reportObjectives.length > 1 && (
                <div className="bg-accent/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-accent">📊 {reportObjectives.length} relatórios</strong> serão gerados para esta conta:
                    {" "}
                    {reportObjectives.map(obj => 
                      CAMPAIGN_OBJECTIVES.find(o => o.value === obj)?.label
                    ).join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Account Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-foreground">Informações da Conta</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">ID da Conta:</span>
                <p className="font-mono text-xs">{account.account_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Plataforma:</span>
                <p>{account.platform === "meta" ? "Meta Ads" : "Google Ads"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="truncate">{account.email || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className={account.status === "active" ? "text-success" : "text-warning"}>
                  {account.status === "active" ? "Ativo" : "Inativo"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
