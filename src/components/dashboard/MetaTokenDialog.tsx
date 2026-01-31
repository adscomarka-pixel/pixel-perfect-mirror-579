import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MetaTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (token: string) => Promise<void>;
  isLoading: boolean;
}

export function MetaTokenDialog({ open, onOpenChange, onSubmit, isLoading }: MetaTokenDialogProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token.trim()) {
      setError("Por favor, insira o token de acesso");
      return;
    }
    
    setError(null);
    try {
      await onSubmit(token.trim());
      setToken("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar conta");
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setToken("");
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar Meta Ads via Token</DialogTitle>
          <DialogDescription>
            Cole o token de acesso do seu Business Manager para conectar suas contas de anúncios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Como obter o token:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-2">
                <li>Acesse o <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  Portal de Desenvolvedores <ExternalLink className="w-3 h-3" />
                </a> e selecione seu app</li>
                <li>No menu lateral, vá em <strong>Casos de uso → Marketing API → Personalizar</strong></li>
                <li>Clique na aba <strong>Ferramentas</strong></li>
                <li>Marque os escopos: <code className="bg-muted px-1 rounded text-xs">ads_read</code>, <code className="bg-muted px-1 rounded text-xs">ads_management</code>, <code className="bg-muted px-1 rounded text-xs">business_management</code>, <code className="bg-muted px-1 rounded text-xs">read_insights</code></li>
                <li>Clique em <strong>"Gerar token"</strong> e copie</li>
              </ol>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="access-token">Token de Acesso</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="Cole seu token de acesso aqui..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ O token expira em aproximadamente 60 dias. Você receberá um alerta antes da expiração.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !token.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              "Conectar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
