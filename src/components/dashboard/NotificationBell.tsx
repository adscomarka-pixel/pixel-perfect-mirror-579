import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export function NotificationBell() {
  const queryClient = useQueryClient();

  // Fetch unread alerts count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-alerts-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch recent alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['notification-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-alerts'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-alerts'] });
    },
  });

  const formatAlertTime = (sentAt: string) => {
    return formatDistanceToNow(new Date(sentAt), { addSuffix: true, locale: ptBR });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !alerts || alerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !alert.is_read ? 'bg-accent/5' : ''
                  }`}
                  onClick={() => {
                    if (!alert.is_read) {
                      markAsReadMutation.mutate(alert.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.type === "warning" || alert.type === "low_balance" 
                        ? "bg-warning/10" 
                        : alert.type === "critical" 
                        ? "bg-destructive/10"
                        : "bg-success/10"
                    }`}>
                      {alert.type === "warning" || alert.type === "low_balance" || alert.type === "critical" ? (
                        <AlertTriangle className={`w-4 h-4 ${
                          alert.type === "critical" ? "text-destructive" : "text-warning"
                        }`} />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatAlertTime(alert.sent_at)}
                        </span>
                        {!alert.is_read && (
                          <span className="w-2 h-2 rounded-full bg-accent" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}