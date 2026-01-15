import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface Alert {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  account: string;
  time: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    title: "Saldo Baixo",
    message: "Conta abaixo do limite mínimo configurado",
    account: "Meta Ads - Loja Virtual",
    time: "Há 2 horas",
  },
  {
    id: "2",
    type: "warning",
    title: "Saldo Baixo",
    message: "Projeção indica que saldo acabará em 3 dias",
    account: "Google Ads - E-commerce",
    time: "Há 5 horas",
  },
  {
    id: "3",
    type: "success",
    title: "Recarga Detectada",
    message: "Nova recarga de R$ 2.000,00 processada",
    account: "Meta Ads - Restaurante",
    time: "Ontem",
  },
  {
    id: "4",
    type: "info",
    title: "Relatório Enviado",
    message: "Relatório semanal enviado para o grupo",
    account: "Todas as contas",
    time: "Ontem",
  },
];

const alertIcons = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const alertColors = {
  warning: "text-warning bg-warning/10",
  info: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
};

export function AlertsList() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Alertas Recentes</h3>
      </div>
      <div className="divide-y divide-border">
        {mockAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          return (
            <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", alertColors[alert.type])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.account}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
