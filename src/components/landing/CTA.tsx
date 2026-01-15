import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "Sem cartão de crédito",
  "Uso ilimitado",
  "Suporte prioritário",
];

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient -z-10" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Pare de perder campanhas por falta de saldo
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Junte-se a centenas de gestores de tráfego que já usam a CMK Performance 
            para monitorar suas campanhas com tranquilidade.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-primary-foreground/90">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button variant="hero" size="xl" asChild className="bg-accent hover:bg-accent/90">
            <Link to="/dashboard">
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
