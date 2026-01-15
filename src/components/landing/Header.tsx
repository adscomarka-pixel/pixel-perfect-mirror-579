import { Button } from "@/components/ui/button";
import { BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg accent-gradient flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">CMK Performance</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/dashboard">Começar Grátis</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-down">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Recursos
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Como Funciona
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Preços
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Button variant="outline" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/dashboard">Começar Grátis</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
