import { AlertTriangle, Clock, Key, X } from "lucide-react";
import { useState } from "react";
import { useExpiringTokens, ExpiringToken } from "@/hooks/useExpiringTokens";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function getExpiryMessage(token: ExpiringToken): string {
  if (token.daysUntilExpiry <= 0) {
    return `Token expirado! Reconecte agora.`;
  } else if (token.daysUntilExpiry === 1) {
    return `Expira amanhã`;
  } else {
    return `Expira em ${token.daysUntilExpiry} dias`;
  }
}

function getStatusStyles(status: ExpiringToken['status']) {
  switch (status) {
    case 'critical':
      return {
        bg: 'bg-destructive/10 border-destructive/30',
        icon: 'text-destructive',
        text: 'text-destructive',
      };
    case 'warning':
      return {
        bg: 'bg-warning/10 border-warning/30',
        icon: 'text-warning',
        text: 'text-warning',
      };
    case 'expiring_soon':
      return {
        bg: 'bg-accent/10 border-accent/30',
        icon: 'text-accent',
        text: 'text-accent',
      };
  }
}

export function TokenExpiryAlert() {
  const { expiringTokens, hasExpiringTokens, criticalCount } = useExpiringTokens();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const navigate = useNavigate();

  if (!hasExpiringTokens) return null;

  // Filter out dismissed alerts (but never dismiss critical ones)
  const visibleTokens = expiringTokens.filter(
    t => t.status === 'critical' || !dismissed.includes(t.id)
  );

  if (visibleTokens.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  const handleRenew = () => {
    navigate('/dashboard/accounts');
  };

  // Show summary banner if multiple tokens are expiring
  if (visibleTokens.length > 2) {
    const styles = criticalCount > 0 
      ? getStatusStyles('critical') 
      : getStatusStyles('warning');

    return (
      <div className={`rounded-lg border p-4 mb-6 ${styles.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center`}>
              <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <div>
              <h4 className={`font-semibold ${styles.text}`}>
                {criticalCount > 0 
                  ? `${criticalCount} token(s) expirado(s) ou expirando em breve!`
                  : `${visibleTokens.length} tokens expirando em breve`
                }
              </h4>
              <p className="text-sm text-muted-foreground">
                Renove seus tokens para manter o monitoramento ativo
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRenew}>
            <Key className="w-4 h-4 mr-2" />
            Renovar Tokens
          </Button>
        </div>
      </div>
    );
  }

  // Show individual alerts for 1-2 tokens
  return (
    <div className="space-y-3 mb-6">
      {visibleTokens.map((token) => {
        const styles = getStatusStyles(token.status);
        
        return (
          <div 
            key={token.id} 
            className={`rounded-lg border p-4 ${styles.bg}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center`}>
                  {token.status === 'critical' ? (
                    <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
                  ) : (
                    <Clock className={`w-5 h-5 ${styles.icon}`} />
                  )}
                </div>
                <div>
                  <h4 className={`font-semibold ${styles.text}`}>
                    {token.account_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {token.platform === 'meta' ? 'Meta Ads' : 'Google Ads'} • {getExpiryMessage(token)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRenew}>
                  <Key className="w-4 h-4 mr-2" />
                  Renovar
                </Button>
                {token.status !== 'critical' && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDismiss(token.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
