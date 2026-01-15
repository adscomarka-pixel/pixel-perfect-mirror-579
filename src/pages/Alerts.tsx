import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Bell, CheckCircle2, MessageSquare, Plus, Settings } from "lucide-react";
import { useState } from "react";

interface AlertConfig {
  id: string;
  account: string;
  platform: "meta" | "google";
  minBalance: number;
  enabled: boolean;
}

const mockAlertConfigs: AlertConfig[] = [
  { id: "1", account: "Loja Virtual SP", platform: "meta", minBalance: 500, enabled: true },
  { id: "2", account: "E-commerce Nacional", platform: "google", minBalance: 1000, enabled: true },
  { id: "3", account: "Restaurante Delivery", platform: "meta", minBalance: 500, enabled: true },
  { id: "4", account: "Clínica Estética", platform: "google", minBalance: 300, enabled: false },
  { id: "5", account: "Academia Premium", platform: "meta", minBalance: 500, enabled: true },
];

const recentAlerts = [
  {
    id: "1",
    type: "warning" as const,
    title: "Saldo Baixo - Restaurante Delivery",
    message: "Saldo de R$ 380,00 está abaixo do limite de R$ 500,00",
    time: "Há 2 horas",
    sent: true,
  },
  {
    id: "2",
    type: "warning" as const,
    title: "Saldo Crítico - Clínica Estética",
    message: "Saldo de R$ 150,00 está abaixo do limite de R$ 300,00",
    time: "Há 5 horas",
    sent: true,
  },
  {
    id: "3",
    type: "success" as const,
    title: "Recarga Detectada - Restaurante Delivery",
    message: "Nova recarga de R$ 2.000,00 processada com sucesso",
    time: "Ontem às 14:32",
    sent: true,
  },
];

const Alerts = () => {
  const [configs, setConfigs] = useState(mockAlertConfigs);

  const toggleAlert = (id: string) => {
    setConfigs(configs.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
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
          <Button variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra de Alerta
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alert Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Settings */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Canal de Notificações</h3>
                  <p className="text-sm text-muted-foreground">Escolha onde receber os alertas</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border hover:border-accent/50 cursor-pointer transition-colors bg-accent/5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">WhatsApp</span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/10 text-success">Ativo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Grupo: CMK Performance Alertas</p>
                </div>
                <div className="p-4 rounded-lg border border-border hover:border-accent/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Telegram</span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">Configurar</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Não configurado</p>
                </div>
              </div>
            </div>

            {/* Alert Rules */}
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Regras de Alerta por Conta</h3>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Todas
                </Button>
              </div>
              <div className="divide-y divide-border">
                {configs.map((config) => (
                  <div key={config.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.enabled ? "bg-warning/10" : "bg-muted"}`}>
                        <Bell className={`w-5 h-5 ${config.enabled ? "text-warning" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{config.account}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.platform === "meta" ? "Meta Ads" : "Google Ads"} • Limite: R$ {config.minBalance.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={() => toggleAlert(config.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Alertas Enviados</h3>
              </div>
              <div className="divide-y divide-border">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        alert.type === "warning" ? "bg-warning/10" : "bg-success/10"
                      }`}>
                        {alert.type === "warning" ? (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">{alert.time}</span>
                          {alert.sent && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-success/10 text-success">
                              Enviado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Alerts;
