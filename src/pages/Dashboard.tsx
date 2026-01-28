import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { AccountsTable } from "@/components/dashboard/AccountsTable";
import { TokenExpiryAlert } from "@/components/dashboard/TokenExpiryAlert";
import { BarChart3, Bell, DollarSign, TrendingUp } from "lucide-react";

const Dashboard = () => {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground">Monitore suas contas de anúncios em tempo real</p>
      </div>

      {/* Token Expiry Alerts */}
      <TokenExpiryAlert />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Saldo Total"
          value="R$ 12.450,00"
          subtitle="Todas as contas"
          icon={DollarSign}
          iconColor="text-success"
          iconBgColor="bg-success/10"
          badge={{ text: "Saudável", variant: "success" }}
        />
        <StatsCard
          title="Alertas Ativos"
          value="2"
          subtitle="Ação necessária"
          icon={Bell}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
          badge={{ text: "Atenção", variant: "warning" }}
        />
        <StatsCard
          title="Gasto Semanal"
          value="R$ 8.320,00"
          subtitle="+12% vs semana anterior"
          icon={TrendingUp}
          iconColor="text-accent"
          iconBgColor="bg-accent/10"
        />
        <StatsCard
          title="Contas Conectadas"
          value="5"
          subtitle="Meta Ads & Google Ads"
          icon={BarChart3}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Table - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AccountsTable />
        </div>

        {/* Alerts List - Takes 1 column */}
        <div className="lg:col-span-1">
          <AlertsList />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
