import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Bell, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Gestão Inteligente de Tráfego Pago</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-slide-up">
            Nunca mais perca uma campanha por{" "}
            <span className="text-gradient">falta de saldo</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Monitore suas contas Meta Ads e Google Ads em tempo real. Receba alertas automáticos 
            e relatórios semanais para manter suas campanhas sempre ativas.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard">
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#how-it-works">Ver Como Funciona</a>
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-card">
              <BarChart3 className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">Relatórios Automáticos</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-card">
              <Bell className="w-4 h-4 text-warning" />
              <span className="text-sm text-foreground">Alertas de Saldo</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-card">
              <Zap className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">Uso Ilimitado</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 max-w-5xl mx-auto animate-scale-in" style={{ animationDelay: "0.4s" }}>
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 rounded-2xl blur-2xl opacity-50" />
            
            {/* Mock Dashboard */}
            <div className="relative bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-background rounded-md text-xs text-muted-foreground">
                    dashboard.cmkperformance.com
                  </div>
                </div>
              </div>
              
              {/* Dashboard Content Preview */}
              <div className="p-6 bg-background">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Balance Card */}
                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Saldo Total</span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-success/10 text-success">
                        Saudável
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">R$ 12.450,00</p>
                    <p className="text-sm text-muted-foreground mt-1">Todas as contas</p>
                  </div>

                  {/* Alerts Card */}
                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Alertas Ativos</span>
                      <Bell className="w-4 h-4 text-warning" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">2</p>
                    <p className="text-sm text-warning mt-1">Ação necessária</p>
                  </div>

                  {/* Accounts Card */}
                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Contas Conectadas</span>
                      <Zap className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">5</p>
                    <p className="text-sm text-muted-foreground mt-1">Meta Ads & Google Ads</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
