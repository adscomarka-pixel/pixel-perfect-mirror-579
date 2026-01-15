import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg accent-gradient flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">CMK Performance</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © 2025 CMK Performance. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
