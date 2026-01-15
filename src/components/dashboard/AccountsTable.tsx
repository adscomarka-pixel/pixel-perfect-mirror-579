import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExternalLink, MoreHorizontal } from "lucide-react";

interface Account {
  id: string;
  name: string;
  platform: "meta" | "google";
  balance: number;
  minBalance: number;
  dailySpend: number;
  status: "healthy" | "warning" | "critical";
}

const mockAccounts: Account[] = [
  {
    id: "1",
    name: "Loja Virtual SP",
    platform: "meta",
    balance: 4500,
    minBalance: 500,
    dailySpend: 320,
    status: "healthy",
  },
  {
    id: "2",
    name: "E-commerce Nacional",
    platform: "google",
    balance: 2800,
    minBalance: 1000,
    dailySpend: 450,
    status: "healthy",
  },
  {
    id: "3",
    name: "Restaurante Delivery",
    platform: "meta",
    balance: 380,
    minBalance: 500,
    dailySpend: 150,
    status: "warning",
  },
  {
    id: "4",
    name: "Clínica Estética",
    platform: "google",
    balance: 150,
    minBalance: 300,
    dailySpend: 80,
    status: "critical",
  },
  {
    id: "5",
    name: "Academia Premium",
    platform: "meta",
    balance: 4120,
    minBalance: 500,
    dailySpend: 280,
    status: "healthy",
  },
];

const statusStyles = {
  healthy: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const statusLabels = {
  healthy: "Saudável",
  warning: "Atenção",
  critical: "Crítico",
};

const platformLabels = {
  meta: "Meta Ads",
  google: "Google Ads",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function calculateDaysRemaining(balance: number, dailySpend: number) {
  if (dailySpend === 0) return "∞";
  return Math.floor(balance / dailySpend);
}

export function AccountsTable() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Contas de Anúncios</h3>
        <Button variant="outline" size="sm">
          <ExternalLink className="w-4 h-4 mr-2" />
          Conectar Nova Conta
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Conta
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Plataforma
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Saldo
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Gasto/Dia
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Dias Restantes
              </th>
              <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockAccounts.map((account) => (
              <tr key={account.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-foreground">{account.name}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-muted-foreground">{platformLabels[account.platform]}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-medium text-foreground">{formatCurrency(account.balance)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm text-muted-foreground">{formatCurrency(account.dailySpend)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm text-foreground">
                    {calculateDaysRemaining(account.balance, account.dailySpend)} dias
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={cn("px-2 py-1 text-xs font-medium rounded-full", statusStyles[account.status])}>
                    {statusLabels[account.status]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
