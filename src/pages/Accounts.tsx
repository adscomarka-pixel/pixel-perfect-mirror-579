import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Loader2, Plus, RefreshCw, Trash2, AlertCircle, Key, Settings } from "lucide-react";
import { useAdAccounts, useOAuthConnect, type AdAccount } from "@/hooks/useAdAccounts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MetaTokenDialog } from "@/components/dashboard/MetaTokenDialog";
import { GoogleTokenDialog } from "@/components/dashboard/GoogleTokenDialog";
import { AccountConfigDialog } from "@/components/dashboard/AccountConfigDialog";

const Accounts = () => {
  const { accounts, isLoading, deleteAccount, syncAccount, syncAllGoogleAccounts } = useAdAccounts();
  const { isConnecting, connectMeta, connectMetaToken, connectGoogle, connectGoogleToken, handleOAuthCallback } = useOAuthConnect();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [metaTokenDialogOpen, setMetaTokenDialogOpen] = useState(false);
  const [googleTokenDialogOpen, setGoogleTokenDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);

  const handleOpenConfig = (account: AdAccount) => {
    setSelectedAccount(account);
    setConfigDialogOpen(true);
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      setOauthError(errorDescription || error);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      // Determine platform from state or URL
      const state = urlParams.get('state');
      const platform = state?.includes('google') ? 'google' : 'meta';
      
      handleOAuthCallback(code, platform as 'meta' | 'google').catch((err) => {
        setOauthError(err.message);
      });
    }
  }, []);

  const handleDelete = (accountId: string) => {
    setAccountToDelete(accountId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteAccount.mutate(accountToDelete);
    }
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Nunca sincronizado';
    return `Há ${formatDistanceToNow(new Date(lastSync), { locale: ptBR })}`;
  };

  const formatConnectedAt = (createdAt: string) => {
    return new Date(createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas Conectadas</h1>
          <p className="text-muted-foreground">Gerencie suas contas de anúncios integradas</p>
        </div>
        <Button variant="hero" disabled={isConnecting}>
          <Plus className="w-4 h-4 mr-2" />
          Conectar Nova Conta
        </Button>
      </div>

      {/* OAuth Error Alert */}
      {oauthError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro na autenticação: {oauthError}
            <Button 
              variant="link" 
              className="ml-2 p-0 h-auto text-destructive-foreground underline"
              onClick={() => setOauthError(null)}
            >
              Fechar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Meta Token (manual - recommended) */}
        <button
          onClick={() => setMetaTokenDialogOpen(true)}
          disabled={isConnecting}
          className="stat-card group cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-left disabled:opacity-50 disabled:cursor-not-allowed relative"
        >
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">Recomendado</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#1877F2]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Key className="w-7 h-7 text-[#1877F2]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Meta Ads (Token)</h3>
              <p className="text-sm text-muted-foreground">Conectar via Token de Acesso</p>
            </div>
          </div>
        </button>

        {/* Meta OAuth */}
        <button
          onClick={connectMeta}
          disabled={isConnecting}
          className="stat-card group cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#1877F2]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              {isConnecting ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#1877F2]" />
              ) : (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Meta Ads (OAuth)</h3>
              <p className="text-sm text-muted-foreground">Conectar via Facebook Login</p>
            </div>
          </div>
        </button>

        {/* Google Token (manual - recommended) */}
        <button
          onClick={() => setGoogleTokenDialogOpen(true)}
          disabled={isConnecting}
          className="stat-card group cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-left disabled:opacity-50 disabled:cursor-not-allowed relative"
        >
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">Recomendado</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#4285F4]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Key className="w-7 h-7 text-[#4285F4]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Google Ads (Token)</h3>
              <p className="text-sm text-muted-foreground">Conectar via Refresh Token</p>
            </div>
          </div>
        </button>

        {/* Google OAuth */}
        <button
          onClick={connectGoogle}
          disabled={isConnecting}
          className="stat-card group cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#4285F4]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              {isConnecting ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#4285F4]" />
              ) : (
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Google Ads (OAuth)</h3>
              <p className="text-sm text-muted-foreground">Conectar via Google Login</p>
            </div>
          </div>
        </button>
      </div>

      {/* Connected Accounts List */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Contas Ativas ({accounts.length})</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => accounts.forEach(a => syncAccount.mutate(a.id))}
            disabled={syncAccount.isPending}
          >
            {syncAccount.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar Todas
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Carregando contas...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma conta conectada ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em um dos cards acima para conectar sua primeira conta.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      account.platform === "meta" ? "bg-[#1877F2]/10" : "bg-[#4285F4]/10"
                    }`}>
                      {account.platform === "meta" ? (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{account.account_name}</p>
                        {account.status === 'active' && (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{account.email || 'Email não disponível'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Conectado em {formatConnectedAt(account.created_at)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Última sync: {formatLastSync(account.last_sync_at)}
                        </span>
                      </div>
                      {/* Balance and Spend Info */}
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-sm font-medium ${account.balance > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                          Saldo: R$ {(account.balance || 0).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Gasto/dia: R$ {(account.daily_spend || 0).toFixed(2)}
                        </span>
                        {account.balance > 0 && account.daily_spend > 0 && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            ~{Math.floor(account.balance / account.daily_spend)} dias restantes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => syncAccount.mutate(account.id)}
                      disabled={syncAccount.isPending}
                      title="Sincronizar"
                    >
                      {syncAccount.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleOpenConfig(account)}
                      title="Configurar"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Abrir plataforma">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(account.id)}
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta será desconectada e você precisará reconectar para monitorar novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Account Config Dialog */}
      <AccountConfigDialog
        account={selectedAccount}
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
      />
    </DashboardLayout>
  );
};

export default Accounts;
