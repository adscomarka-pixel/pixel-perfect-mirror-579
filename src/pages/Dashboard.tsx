import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TokenExpiryAlert } from "@/components/dashboard/TokenExpiryAlert";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Users,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { cn, formatBRL, parseToNumber } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { stats, recentAlerts, accountsSummary, isLoading } = useDashboardStats();

  const getTokenHealthStatus = () => {
    if (stats.tokensExpired > 0) return { label: "Crítico", variant: "destructive" as const };
    if (stats.tokensExpiringSoon > 0) return { label: "Atenção", variant: "warning" as const };
    if (stats.totalAccounts === 0) return { label: "Sem contas", variant: "secondary" as const };
    return { label: "Saudável", variant: "success" as const };
  };

  const getBalanceHealthStatus = () => {
    if (stats.accountsWithLowBalance > 0) return { label: "Baixo", variant: "warning" as const };
    if (stats.totalAccounts === 0) return { label: "Sem contas", variant: "secondary" as const };
    return { label: "Saudável", variant: "success" as const };
  };

  const tokenHealth = getTokenHealthStatus();
  const balanceHealth = getBalanceHealthStatus();

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground">Resumo do seu painel de gestão de anúncios</p>
      </div>

      {/* Token Expiry Alerts */}
      <TokenExpiryAlert />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold">{formatBRL(stats.totalBalance)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={balanceHealth.variant}>{balanceHealth.label}</Badge>
                  {stats.accountsWithLowBalance > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {stats.accountsWithLowBalance} conta(s) com saldo baixo
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Conectadas
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {stats.metaAccounts > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      {stats.metaAccounts} Meta
                    </span>
                  )}
                  {stats.googleAccounts > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      {stats.googleAccounts} Google
                    </span>
                  )}
                  {stats.totalAccounts === 0 && "Nenhuma conta conectada"}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Token Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saúde dos Tokens
            </CardTitle>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              stats.tokensExpired > 0 ? "bg-destructive/10" :
                stats.tokensExpiringSoon > 0 ? "bg-warning/10" : "bg-success/10"
            )}>
              {stats.tokensExpired > 0 ? (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              ) : stats.tokensExpiringSoon > 0 ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-success" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={tokenHealth.variant}>{tokenHealth.label}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  {stats.healthyTokens > 0 && (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      {stats.healthyTokens} ok
                    </span>
                  )}
                  {stats.tokensExpiringSoon > 0 && (
                    <span className="flex items-center gap-1 text-warning">
                      <Clock className="h-3 w-3" />
                      {stats.tokensExpiringSoon} expirando
                    </span>
                  )}
                  {stats.tokensExpired > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-3 w-3" />
                      {stats.tokensExpired} expirado(s)
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas
            </CardTitle>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              stats.unreadAlerts > 0 ? "bg-warning/10" : "bg-muted"
            )}>
              <AlertCircle className={cn(
                "h-4 w-4",
                stats.unreadAlerts > 0 ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.unreadAlerts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.unreadAlerts === 0 ? "Nenhum alerta pendente" :
                    stats.unreadAlerts === 1 ? "alerta não lido" : "alertas não lidos"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Daily Spend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gasto Diário Total
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-xl font-semibold">{formatBRL(stats.totalDailySpend)}</p>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Relatórios Gerados
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <p className="text-xl font-semibold">{stats.totalReports}</p>
                {stats.recentReports > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {stats.recentReports} nos últimos 7 dias
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Ativas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <>
                <p className="text-xl font-semibold">
                  {stats.activeAccounts}/{stats.totalAccounts}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAccounts === 0 ? "Nenhuma conta" :
                    stats.activeAccounts === stats.totalAccounts ? "Todas ativas" :
                      `${stats.totalAccounts - stats.activeAccounts} inativa(s)`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts with lowest balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contas com Menor Saldo</CardTitle>
            <CardDescription>
              Contas que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : accountsSummary.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma conta conectada</p>
                <p className="text-sm">Conecte suas contas de anúncios para ver os dados aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accountsSummary.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        account.platform === 'meta' ? "bg-accent" : "bg-destructive"
                      )} />
                      <div>
                        <p className="font-medium text-sm">{account.account_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        parseToNumber(account.balance) < 500 ? "text-destructive" : "text-foreground"
                      )}>
                        {formatBRL(account.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gasto: {formatBRL(account.daily_spend)}/dia
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alertas Recentes</CardTitle>
            <CardDescription>
              Últimas notificações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum alerta</p>
                <p className="text-sm">Você será notificado quando algo precisar de atenção</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      alert.is_read ? "bg-muted/30" : "bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      alert.type === 'low_balance' ? "bg-warning" :
                        alert.type === 'token_expiry' ? "bg-destructive" :
                          "bg-primary"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "font-medium text-sm truncate",
                          !alert.is_read && "text-foreground"
                        )}>
                          {alert.title}
                        </p>
                        {!alert.is_read && (
                          <Badge variant="secondary" className="text-xs">Novo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(parseISO(alert.sent_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
