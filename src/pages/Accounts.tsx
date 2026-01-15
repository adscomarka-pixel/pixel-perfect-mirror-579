import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Link2, Plus, RefreshCw, Trash2 } from "lucide-react";

const connectedAccounts = [
  {
    id: "1",
    name: "Loja Virtual SP",
    platform: "meta",
    email: "ads@lojavirtual.com",
    connectedAt: "12 Dez 2024",
    lastSync: "Há 5 minutos",
  },
  {
    id: "2",
    name: "E-commerce Nacional",
    platform: "google",
    email: "marketing@ecommerce.com.br",
    connectedAt: "10 Dez 2024",
    lastSync: "Há 15 minutos",
  },
  {
    id: "3",
    name: "Restaurante Delivery",
    platform: "meta",
    email: "gerente@restaurante.com",
    connectedAt: "08 Dez 2024",
    lastSync: "Há 5 minutos",
  },
  {
    id: "4",
    name: "Clínica Estética",
    platform: "google",
    email: "admin@clinica.com",
    connectedAt: "05 Dez 2024",
    lastSync: "Há 1 hora",
  },
  {
    id: "5",
    name: "Academia Premium",
    platform: "meta",
    email: "marketing@academia.com",
    connectedAt: "01 Dez 2024",
    lastSync: "Há 10 minutos",
  },
];

const Accounts = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas Conectadas</h1>
            <p className="text-muted-foreground">Gerencie suas contas de anúncios integradas</p>
          </div>
          <Button variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            Conectar Nova Conta
          </Button>
        </div>

        {/* Connection Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="stat-card group cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#1877F2]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Meta Ads</h3>
                <p className="text-sm text-muted-foreground">Conectar conta Facebook/Instagram Ads</p>
              </div>
            </div>
          </div>
          <div className="stat-card group cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#4285F4]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Google Ads</h3>
                <p className="text-sm text-muted-foreground">Conectar conta Google Ads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Accounts List */}
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Contas Ativas ({connectedAccounts.length})</h3>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar Todas
            </Button>
          </div>
          <div className="divide-y divide-border">
            {connectedAccounts.map((account) => (
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
                        <p className="font-medium text-foreground">{account.name}</p>
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      </div>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Conectado em {account.connectedAt}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Última sync: {account.lastSync}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Accounts;
