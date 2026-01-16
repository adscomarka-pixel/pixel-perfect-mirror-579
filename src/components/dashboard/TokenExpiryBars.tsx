import { Key } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";

const MAX_DAYS = 60; // Token duration in days

interface TokenInfo {
  id: string;
  account_name: string;
  platform: string;
  token_expires_at: string | null;
  daysUntilExpiry: number;
}

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

function getExpiryText(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 0) {
    return 'Expirado!';
  } else if (daysUntilExpiry === 1) {
    return 'Expira amanhã';
  } else {
    return `${daysUntilExpiry} dias restantes`;
  }
}

interface TokenExpiryBarsProps {
  onRenewClick?: () => void;
}

export function TokenExpiryBars({ onRenewClick }: TokenExpiryBarsProps) {
  const { data: tokens } = useQuery({
    queryKey: ['all-token-expiry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, account_name, platform, token_expires_at')
        .not('token_expires_at', 'is', null)
        .order('token_expires_at', { ascending: true });

      if (error) throw error;

      const now = new Date();
      return (data || []).map(account => {
        const expiryDate = account.token_expires_at ? parseISO(account.token_expires_at) : null;
        const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, now) : 0;
        
        return {
          ...account,
          daysUntilExpiry,
        } as TokenInfo;
      });
    },
    refetchInterval: 1000 * 60 * 60,
  });

  if (!tokens || tokens.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-sm font-medium text-muted-foreground">Validade dos Tokens</h3>
      {tokens.map((token) => {
        const percentage = getProgressPercentage(token.daysUntilExpiry);
        const colorClass = getProgressColor(token.daysUntilExpiry);
        const isUrgent = token.daysUntilExpiry <= 7;
        
        return (
          <div 
            key={token.id} 
            className={`rounded-lg border p-3 transition-colors ${
              isUrgent ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                <span className="font-medium text-foreground text-sm">
                  {token.account_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {token.platform === 'meta' ? 'Meta' : 'Google'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${
                  token.daysUntilExpiry <= 0 ? 'text-destructive' :
                  token.daysUntilExpiry <= 3 ? 'text-destructive' : 
                  token.daysUntilExpiry <= 7 ? 'text-warning' : 
                  token.daysUntilExpiry <= 14 ? 'text-amber-500' :
                  'text-muted-foreground'
                }`}>
                  {getExpiryText(token.daysUntilExpiry)}
                </span>
                {isUrgent && onRenewClick && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs px-2 text-destructive hover:text-destructive" 
                    onClick={onRenewClick}
                  >
                    <Key className="w-3 h-3 mr-1" />
                    Renovar
                  </Button>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
