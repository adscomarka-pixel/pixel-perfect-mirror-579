import { Key } from "lucide-react";
import { useExpiringTokens, ExpiringToken } from "@/hooks/useExpiringTokens";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const MAX_DAYS = 60; // Token duration in days

function getProgressPercentage(daysUntilExpiry: number): number {
  if (daysUntilExpiry <= 0) return 0;
  return Math.min(100, Math.max(0, (daysUntilExpiry / MAX_DAYS) * 100));
}

function getProgressColor(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 0) return 'bg-destructive';
  if (daysUntilExpiry <= 3) return 'bg-destructive';
  if (daysUntilExpiry <= 7) return 'bg-warning';
  if (daysUntilExpiry <= 14) return 'bg-amber-500';
  if (daysUntilExpiry <= 30) return 'bg-accent';
  return 'bg-success';
}

function getExpiryText(token: ExpiringToken): string {
  if (token.daysUntilExpiry <= 0) {
    return 'Expirado!';
  } else if (token.daysUntilExpiry === 1) {
    return 'Expira amanhã';
  } else {
    return `${token.daysUntilExpiry} dias restantes`;
  }
}

export function TokenExpiryAlert() {
  const { expiringTokens } = useExpiringTokens();
  const navigate = useNavigate();

  // Show all tokens that have expiry dates (not just expiring ones)
  // We need to fetch all accounts with tokens to show the progress bars
  
  if (expiringTokens.length === 0) return null;

  const handleRenew = () => {
    navigate('/dashboard/accounts');
  };

  return (
    <div className="space-y-3 mb-6">
      {expiringTokens.map((token) => {
        const percentage = getProgressPercentage(token.daysUntilExpiry);
        const colorClass = getProgressColor(token.daysUntilExpiry);
        
        return (
          <div 
            key={token.id} 
            className="bg-card rounded-lg border border-border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm">
                  {token.account_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({token.platform === 'meta' ? 'Meta Ads' : 'Google Ads'})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${
                  token.daysUntilExpiry <= 3 ? 'text-destructive' : 
                  token.daysUntilExpiry <= 7 ? 'text-warning' : 
                  'text-muted-foreground'
                }`}>
                  {getExpiryText(token)}
                </span>
                {token.daysUntilExpiry <= 7 && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRenew}>
                    <Key className="w-3 h-3 mr-1" />
                    Renovar
                  </Button>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${colorClass} transition-all duration-500 ease-out rounded-full`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
