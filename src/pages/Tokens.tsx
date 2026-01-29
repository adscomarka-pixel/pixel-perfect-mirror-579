import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Key, RefreshCw, Shield, Infinity, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MetaTokenDialog } from "@/components/dashboard/MetaTokenDialog";
import { GoogleTokenDialog } from "@/components/dashboard/GoogleTokenDialog";
import { useOAuthConnect } from "@/hooks/useAdAccounts";

const META_MAX_DAYS = 60;

interface TokenInfo {
  id: string;
  account_name: string;
  platform: string;
  token_expires_at: string | null;
  daysUntilExpiry: number | null;
  created_at: string;
  hasRefreshToken: boolean;
}

function getProgressPercentage(daysUntilExpiry: number | null, platform: string): number {
  // Google tokens with refresh token don't expire
  if (platform === 'google') return 100;
  
  if (daysUntilExpiry === null || daysUntilExpiry <= 0) return 0;
  return Math.min(100, Math.max(0, (daysUntilExpiry / META_MAX_DAYS) * 100));
}

function getProgressColor(daysUntilExpiry: number | null, platform: string): string {
  // Google tokens with refresh token are always healthy
  if (platform === 'google') return 'bg-success';
  
  if (daysUntilExpiry === null || daysUntilExpiry <= 0) return 'bg-destructive';
  if (daysUntilExpiry <= 3) return 'bg-destructive';
  if (daysUntilExpiry <= 7) return 'bg-warning';
  if (daysUntilExpiry <= 14) return 'bg-amber-500';
  if (daysUntilExpiry <= 30) return 'bg-accent';
  return 'bg-success';
}

function getStatusBadge(daysUntilExpiry: number | null, platform: string) {
  // Google tokens with refresh token don't expire
  if (platform === 'google') {
    return { text: 'Permanente', class: 'bg-success/10 text-success' };
  }
  
  if (daysUntilExpiry === null || daysUntilExpiry <= 0) {
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

function getExpiryText(daysUntilExpiry: number | null, platform: string): string {
  // Google refresh tokens don't expire
  if (platform === 'google') {
    return 'Não expira';
  }
  
  if (daysUntilExpiry === null || daysUntilExpiry <= 0) {
    return 'Token expirado!';
  } else if (daysUntilExpiry === 1) {
    return 'Expira amanhã';
  } else {
    return `${daysUntilExpiry} dias restantes`;
  }
}

const Tokens = () => {
  const [metaTokenDialogOpen, setMetaTokenDialogOpen] = useState(false);
  const [googleTokenDialogOpen, setGoogleTokenDialogOpen] = useState(false);
  const { connectMetaToken, connectGoogleToken, isConnecting } = useOAuthConnect();

  const { data: tokens, isLoading, refetch } = useQuery({
    queryKey: ['all-tokens-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, account_name, platform, token_expires_at, created_at, refresh_token')
        .order('platform', { ascending: false }) // Meta first, then Google
        .order('token_expires_at', { ascending: true });

      if (error) throw error;

      const now = new Date();
      return (data || []).map(account => {
        const hasRefreshToken = !!account.refresh_token;
        
        // For Google, if has refresh token, it doesn't expire
        if (account.platform === 'google' && hasRefreshToken) {
          return {
            id: account.id,
            account_name: account.account_name,
            platform: account.platform,
            token_expires_at: null,
            daysUntilExpiry: null, // null means doesn't expire
            created_at: account.created_at,
            hasRefreshToken,
          } as TokenInfo;
        }
        
        // For Meta or Google without refresh token
        const expiryDate = account.token_expires_at ? parseISO(account.token_expires_at) : null;
        const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, now) : 0;
        
        return {
          id: account.id,
          account_name: account.account_name,
          platform: account.platform,
          token_expires_at: account.token_expires_at,
          daysUntilExpiry,
          created_at: account.created_at,
          hasRefreshToken,
        } as TokenInfo;
      });
    },
    refetchInterval: 1000 * 60 * 5,
  });

  // Only count Meta tokens as critical (Google doesn't expire)
  const metaTokens = tokens?.filter(t => t.platform === 'meta') || [];
  const googleTokens = tokens?.filter(t => t.platform === 'google') || [];
  const criticalCount = metaTokens.filter(t => t.daysUntilExpiry !== null && t.daysUntilExpiry <= 7).length;

  return (
    <DashboardLayout>
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
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
            <div className="w-12 h-12 rounded-xl bg-[#4285F4]/10 flex items-center justify-center">
              <Infinity className="w-6 h-6 text-[#4285F4]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{googleTokens.length}</p>
              <p className="text-sm text-muted-foreground">Google (Permanentes)</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1877F2]/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#1877F2]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metaTokens.length}</p>
              <p className="text-sm text-muted-foreground">Meta (60 dias)</p>
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
              const percentage = getProgressPercentage(token.daysUntilExpiry, token.platform);
              const colorClass = getProgressColor(token.daysUntilExpiry, token.platform);
              const badge = getStatusBadge(token.daysUntilExpiry, token.platform);
              const isUrgent = token.platform === 'meta' && token.daysUntilExpiry !== null && token.daysUntilExpiry <= 7;
              const isGoogle = token.platform === 'google';
              
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
                          {isGoogle ? (
                            <span className="text-success ml-1">Refresh Token (não expira)</span>
                          ) : (
                            token.token_expires_at ? (
                              ` Expira em ${format(parseISO(token.token_expires_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`
                            ) : ' Data não definida'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badge.class}`}>
                        {badge.text}
                      </span>
                      <span className={`text-sm font-medium min-w-[120px] text-right ${
                        isGoogle ? 'text-success' :
                        token.daysUntilExpiry === null || token.daysUntilExpiry <= 0 ? 'text-destructive' :
                        token.daysUntilExpiry <= 3 ? 'text-destructive' : 
                        token.daysUntilExpiry <= 7 ? 'text-warning' : 
                        'text-muted-foreground'
                      }`}>
                        {getExpiryText(token.daysUntilExpiry, token.platform)}
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

      {/* Info Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-[#4285F4]/5 rounded-lg border border-[#4285F4]/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 flex items-center justify-center flex-shrink-0">
              <Infinity className="w-4 h-4 text-[#4285F4]" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Google Ads - Tokens Permanentes</p>
              <p className="text-sm text-muted-foreground">
                Os <strong>Refresh Tokens</strong> do Google Ads <strong>não expiram</strong> automaticamente. 
                Eles só são invalidados se você revogar o acesso manualmente no Google ou alterar a senha da conta.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-[#1877F2]/5 rounded-lg border border-[#1877F2]/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[#1877F2]" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Meta Ads - Tokens de 60 dias</p>
              <p className="text-sm text-muted-foreground">
                Os tokens do Meta Ads expiram em aproximadamente <strong>60 dias</strong>. 
                Renove-os antes da expiração para manter o monitoramento ativo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Token Dialog */}
      <MetaTokenDialog
        open={metaTokenDialogOpen}
        onOpenChange={setMetaTokenDialogOpen}
        onSubmit={connectMetaToken}
        isLoading={isConnecting}
      />
      
      {/* Google Token Dialog */}
      <GoogleTokenDialog
        open={googleTokenDialogOpen}
        onOpenChange={setGoogleTokenDialogOpen}
        onSubmit={connectGoogleToken}
        isLoading={isConnecting}
      />
    </DashboardLayout>
  );
};

export default Tokens;