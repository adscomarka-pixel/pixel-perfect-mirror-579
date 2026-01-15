import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Conecte suas Contas",
    description: "Faça login com OAuth nas suas contas Meta Ads e Google Ads. Processo seguro e em segundos.",
    details: ["Meta Ads (Facebook/Instagram)", "Google Ads", "Autenticação OAuth segura"],
  },
  {
    number: "02",
    title: "Configure seus Alertas",
    description: "Defina limites de saldo mínimo para cada conta e escolha como quer ser notificado.",
    details: ["Limites personalizados por conta", "WhatsApp ou Telegram", "Frequência configurável"],
  },
  {
    number: "03",
    title: "Receba Relatórios Automáticos",
    description: "Todo o trabalho acontece automaticamente. Você só precisa tomar decisões.",
    details: ["Relatórios semanais de campanhas", "Alertas em tempo real", "Histórico completo de dados"],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simples como <span className="text-gradient">deve ser</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Configure uma vez, monitore para sempre. Sem complicações, sem configurações técnicas.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.number} 
              className="relative flex gap-6 md:gap-12 pb-12 last:pb-0 animate-slide-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center text-lg font-bold text-accent-foreground shadow-glow">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-accent to-accent/20 mt-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
