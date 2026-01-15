import { BarChart3, Bell, FileText, Link2, MessageSquare, Shield } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Integração Simples",
    description: "Conecte suas contas Meta Ads e Google Ads em segundos com autenticação segura OAuth.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: BarChart3,
    title: "Relatórios Semanais",
    description: "Receba relatórios automáticos com métricas de desempenho: impressões, cliques, CTR e conversões.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Bell,
    title: "Alertas de Saldo",
    description: "Configure limites personalizados e receba alertas antes que suas campanhas sejam pausadas.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: MessageSquare,
    title: "Notificações Inteligentes",
    description: "Envie alertas e relatórios automaticamente para WhatsApp ou Telegram do seu time.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Export PDF/CSV",
    description: "Baixe relatórios profissionais em PDF ou dados brutos em CSV para análises avançadas.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Shield,
    title: "Uso Ilimitado",
    description: "Sem tokens, sem limites. Gere quantos relatórios precisar e receba todos os alertas.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa para{" "}
            <span className="text-gradient">gestão eficiente</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ferramentas simples e poderosas para gestores de tráfego e agências
            que não querem mais surpresas desagradáveis.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
