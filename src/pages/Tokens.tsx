import { Sidebar } from "@/components/dashboard/Sidebar";
import { Key, RefreshCw, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MetaTokenDialog } from "@/components/dashboard/MetaTokenDialog";
import { useOAuthConnect } from "@/hooks/useAdAccounts";

const MAX_DAYS = 60;

interface TokenInfo {
  id: string;
  account_name: string;
  platform: string;
  token_expires_at: string | null;
  daysUntilExpiry: number;
  created_at: string;
}

function getProgressPercentage(daysUntilExpiry: number): number {
  if (daysUntilExpiry <= 0) return 0;
  return Math.min(100, Math.max(0, (daysUntilExpiry / MAX_DAYS) * 100));
}

function getProgressColor(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 0) return 'bg-destructive';
  if (daysUntilExpiry <= 3) return 'bg-destructive';
  if (daysUntilExpiry <= 7) return 'bg-warning';
  if (daysUntilExpiry <= 14) return 'bg-amber-500';
  if (daysUntilExpiry <= 30) return 'bg-accent';
  return 'bg-success';
}

function getStatusBadge(daysUntilExpiry: number) {
  if (daysUntilExpiry <= 0) {
    return { text: 'Expirado', class: 'bg-destructive/10 text-destructive' };
  }
  if (daysUntilExpiry <= 3) {
    return { text: 'Crítico', class: 'bg-destructive/10 text-destructive' };
  }
  if (daysUntilExpiry <= 7) {
    return { text: 'Urgente', class: 'bg-warning/10 text-warning' };
  }
  if (daysUntilExpiry <= 14) {
    return { text: 'Atenção', class: 'bg-amber-500/10 text-amber-500' };
  }
  if (daysUntilExpiry <= 30) {
    return { text: 'OK', class: 'bg-accent/10 text-accent' };
  }
  return { text: 'Saudável', class: 'bg-success/10 text-success' };
}

function getExpiryText(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 0) {
    return 'Token expirado!';
  } else if (daysUntilExpiry === 1) {
    return 'Expira amanhã';
  } else {
    return `${daysUntilExpiry} dias restantes`;
  }
}

const Tokens = () => {
  const [metaTokenDialogOpen, setMetaTokenDialogOpen] = useState(false);
  const { connectMetaToken, isConnecting } = useOAuthConnect();

  const { data: tokens, isLoading, refetch } = useQuery({
    queryKey: ['all-tokens-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, account_name, platform, token_expires_at, created_at')
        .order('token_expires_at', { ascending: true });

      if (error) throw error;

      const now = new Date();
      return (data || []).map(account => {
        const expiryDate = account.token_expires_at ? parseISO(account.token_expires_at) : null;
        const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, now) : 0;
        
        return {
          ...account,
          daysUntilExpiry,
        } as TokenInfo;
      });
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  const criticalCount = tokens?.filter(t => t.daysUntilExpiry <= 7).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Validade dos Tokens</h1>
            <p className="text-muted-foreground">Monitore a expiração dos tokens de acesso das suas contas</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="hero" onClick={() => setMetaTokenDialogOpen(true)}>
              <Key className="w-4 h-4 mr-2" />
              Renovar Token
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{tokens?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Tokens Ativos</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                criticalCount > 0 ? 'bg-destructive/10' : 'bg-success/10'
              }`}>
                <Key className={`w-6 h-6 ${criticalCount > 0 ? 'text-destructive' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Precisam Renovação</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">60</p>
                <p className="text-sm text-muted-foreground">Dias de Validade</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tokens List */}
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Status dos Tokens</h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Carregando tokens...</p>
            </div>
          ) : !tokens || tokens.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum token encontrado.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Conecte uma conta para começar a monitorar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tokens.map((token) => {
                const percentage = getProgressPercentage(token.daysUntilExpiry);
                const colorClass = getProgressColor(token.daysUntilExpiry);
                const badge = getStatusBadge(token.daysUntilExpiry);
                const isUrgent = token.daysUntilExpiry <= 7;
                
                return (
                  <div 
                    key={token.id} 
                    className={`p-5 transition-colors ${isUrgent ? 'bg-destructive/5' : 'hover:bg-muted/30'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          token.platform === 'meta' ? 'bg-[#1877F2]/10' : 'bg-[#4285F4]/10'
                        }`}>
                          {token.platform === 'meta' ? (
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
                          <p className="font-medium text-foreground">{token.account_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {token.platform === 'meta' ? 'Meta Ads' : 'Google Ads'} • 
                            Expira em {token.token_expires_at ? format(parseISO(token.token_expires_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badge.class}`}>
                          {badge.text}
                        </span>
                        <span className={`text-sm font-medium min-w-[120px] text-right ${
                          token.daysUntilExpiry <= 0 ? 'text-destructive' :
                          token.daysUntilExpiry <= 3 ? 'text-destructive' : 
                          token.daysUntilExpiry <= 7 ? 'text-warning' : 
                          'text-muted-foreground'
                        }`}>
                          {getExpiryText(token.daysUntilExpiry)}
                        </span>
                        {isUrgent && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setMetaTokenDialogOpen(true)}
                          >
                            <Key className="w-4 h-4 mr-1" />
                            Renovar
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorClass} transition-all duration-500 ease-out rounded-full ${
                          isUrgent ? 'animate-pulse' : ''
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>💡 Dica:</strong> Os tokens do Meta Ads expiram em aproximadamente 60 dias. 
            Renove-os antes da expiração para manter o monitoramento ativo. 
            Tokens expirados impedem a sincronização de saldos e métricas.
          </p>
        </div>
      </main>

      {/* Meta Token Dialog */}
      <MetaTokenDialog
        open={metaTokenDialogOpen}
        onOpenChange={setMetaTokenDialogOpen}
        onSubmit={connectMetaToken}
        isLoading={isConnecting}
      />
    </div>
  );
};

export default Tokens;
