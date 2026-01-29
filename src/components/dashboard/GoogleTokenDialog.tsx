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

interface GoogleTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (refreshToken: string, clientId: string, clientSecret: string) => Promise<void>;
  isLoading: boolean;
}

export function GoogleTokenDialog({ open, onOpenChange, onSubmit, isLoading }: GoogleTokenDialogProps) {
  const [refreshToken, setRefreshToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!refreshToken.trim()) {
      setError("Por favor, insira o Refresh Token");
      return;
    }
    if (!clientId.trim()) {
      setError("Por favor, insira o Client ID");
      return;
    }
    if (!clientSecret.trim()) {
      setError("Por favor, insira o Client Secret");
      return;
    }
    
    setError(null);
    try {
      await onSubmit(refreshToken.trim(), clientId.trim(), clientSecret.trim());
      setRefreshToken("");
      setClientId("");
      setClientSecret("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar conta");
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setRefreshToken("");
      setClientId("");
      setClientSecret("");
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar Google Ads via Token</DialogTitle>
          <DialogDescription>
            Use o OAuth Playground do Google para gerar um Refresh Token permanente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Como obter o Refresh Token:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Acesse o <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  OAuth Playground <ExternalLink className="w-3 h-3" />
                </a></li>
                <li>Clique na engrenagem ⚙️ e marque <strong>"Use your own OAuth credentials"</strong></li>
                <li>Insira seu Client ID e Client Secret</li>
                <li>No Step 1, selecione o escopo: <code className="bg-muted px-1 rounded text-xs">https://www.googleapis.com/auth/adwords</code></li>
                <li>Clique em <strong>"Authorize APIs"</strong> e faça login</li>
                <li>No Step 2, clique em <strong>"Exchange authorization code for tokens"</strong></li>
                <li>Copie o <strong>Refresh Token</strong> gerado</li>
              </ol>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-id">Client ID</Label>
              <Input
                id="client-id"
                type="text"
                placeholder="xxx.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-secret">Client Secret</Label>
              <Input
                id="client-secret"
                type="password"
                placeholder="Cole seu Client Secret aqui..."
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh-token">Refresh Token</Label>
              <Input
                id="refresh-token"
                type="password"
                placeholder="Cole seu Refresh Token aqui..."
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                ✅ O Refresh Token não expira e permite acesso contínuo à API do Google Ads.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !refreshToken.trim() || !clientId.trim() || !clientSecret.trim()}>
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
