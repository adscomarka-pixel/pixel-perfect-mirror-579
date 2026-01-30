import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Loader2, 
  Settings2, 
  TrendingUp,
  Calendar,
  Settings,
  Play
} from "lucide-react";
import { useAdAccounts, type AdAccount, CAMPAIGN_OBJECTIVES } from "@/hooks/useAdAccounts";
import { AccountConfigDialog } from "@/components/dashboard/AccountConfigDialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function ReportConfigTab() {
  const queryClient = useQueryClient();
  const [periodDays, setPeriodDays] = useState("7");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<"all" | "meta" | "google">("all");
  
  const { accounts, isLoading: isLoadingAccounts } = useAdAccounts();

  // Filter accounts by platform
  const filteredAccounts = accounts.filter(account => {
    if (platformFilter === "all") return true;
    return account.platform === platformFilter;
  });

  const [generatingAccountId, setGeneratingAccountId] = useState<string | null>(null);

  // Generate report mutation (for all accounts or single account)
  const generateReportMutation = useMutation({
    mutationFn: async (accountId?: string) => {
      if (accountId) {
        setGeneratingAccountId(accountId);
      } else {
        setIsGenerating(true);
      }
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          periodDays: parseInt(periodDays),
          accountId: accountId || undefined,
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      if (data.summary.totalAccounts === 1) {
        toast.success(`Relatório gerado com sucesso!`, {
          description: `Período: ${data.summary.periodStart} a ${data.summary.periodEnd}`
        });
      } else {
        toast.success(`${data.summary.successCount} relatórios gerados!`, {
          description: `${data.summary.totalAccounts} contas processadas • ${data.summary.periodStart} a ${data.summary.periodEnd}`
        });
      }
    },
    onError: (error) => {
      toast.error('Erro ao gerar relatórios: ' + error.message);
    },
    onSettled: () => {
      setIsGenerating(false);
      setGeneratingAccountId(null);
    }
  });

  return (
    <div className="space-y-6">
      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Relatório de Campanhas</h3>
              <p className="text-sm text-muted-foreground">Impressões, cliques, CTR, conversões</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Relatório de Saldo</h3>
              <p className="text-sm text-muted-foreground">Saldos, recargas, projeção de consumo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Geração de Relatórios</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Info about individual reports */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Como funciona:</strong> Ao gerar relatórios, será criado um relatório individual para cada conta de anúncios conectada. 
              Cada relatório aparecerá separadamente na aba "Notificações", facilitando a integração com automações para enviar ao grupo de cada cliente.
            </p>
          </div>

          {/* Period Selection */}
          <div className="space-y-2">
            <Label htmlFor="period">Período do Relatório</Label>
            <Select value={periodDays} onValueChange={setPeriodDays}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <div className="pt-4 border-t border-border">
            <Button 
              variant="hero"
              size="lg"
              onClick={() => generateReportMutation.mutate(undefined)}
              disabled={isGenerating}
              className="w-full md:w-auto"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Gerando Relatório...' : 'Gerar Relatório Agora'}
            </Button>
          </div>
        </div>
      </div>

      {/* Account Configuration List */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Configuração das Contas</h3>
          </div>
          
          {/* Platform Filter */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={platformFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPlatformFilter("all")}
              className="h-8 px-3"
            >
              Todas
            </Button>
            <Button
              variant={platformFilter === "meta" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPlatformFilter("meta")}
              className="h-8 px-3 gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Meta
            </Button>
            <Button
              variant={platformFilter === "google" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPlatformFilter("google")}
              className="h-8 px-3 gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
          </div>
        </div>
        <div className="p-4">
          {isLoadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {accounts.length === 0 ? (
                <>
                  <p>Nenhuma conta de anúncios conectada.</p>
                  <p className="text-sm">Conecte uma conta na página de Contas.</p>
                </>
              ) : (
                <p>Nenhuma conta {platformFilter === "meta" ? "Meta" : "Google"} encontrada.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
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
                    <div>
                      <p className="font-medium text-foreground">{account.account_name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {(account.report_objectives || ['MESSAGES']).map(obj => {
                          const config = CAMPAIGN_OBJECTIVES.find(o => o.value === obj);
                          return config ? (
                            <Badge key={obj} variant="secondary" className="text-xs gap-1">
                              <span>{config.icon}</span>
                              {config.label}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateReportMutation.mutate(account.id)}
                      disabled={generatingAccountId === account.id}
                      className="gap-1.5"
                    >
                      {generatingAccountId === account.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Gerar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedAccount(account);
                        setConfigDialogOpen(true);
                      }}
                      className="hover:bg-muted"
                    >
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Format Preview */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Prévia dos Formatos de Relatório</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cada objetivo de campanha gera um relatório com métricas específicas
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Messages Template */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h4 className="font-medium text-sm">Mensagens</h4>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
{`💰 Investimento total: R$ X.XXX,XX

💬 Mensagens iniciadas: X.XXX

📈 Custo por mensagens: R$ X,XX`}
            </pre>
          </div>

          {/* Leads Template */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h4 className="font-medium text-sm">Leads</h4>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
{`💰 Investimento total: R$ X.XXX,XX

📋 Leads gerados: X.XXX

📈 Custo por leads: R$ X,XX`}
            </pre>
          </div>

          {/* Conversions Template */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h4 className="font-medium text-sm">Conversões</h4>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
{`💰 Investimento total: R$ X.XXX,XX

🎯 Conversões realizadas: X.XXX

📈 Custo por conversões: R$ X,XX`}
            </pre>
          </div>

          {/* Traffic Template */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔗</span>
              <h4 className="font-medium text-sm">Tráfego</h4>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
{`💰 Investimento total: R$ X.XXX,XX

🔗 Cliques no link: X.XXX

📈 Custo por cliques: R$ X,XX`}
            </pre>
          </div>
        </div>
        <div className="px-6 pb-6">
          <p className="text-xs text-muted-foreground">
            * Configure os objetivos de cada conta clicando no ícone de engrenagem na lista acima
          </p>
        </div>
      </div>

      {/* Account Config Dialog */}
      <AccountConfigDialog
        account={selectedAccount}
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
      />
    </div>
  );
}
