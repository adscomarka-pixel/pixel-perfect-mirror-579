import { Bell, AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function NotificationsTab() {
  const queryClient = useQueryClient();

  // Fetch all alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['all-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);
      
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
      queryClient.invalidateQueries({ queryKey: ['all-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-alerts'] });
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
      queryClient.invalidateQueries({ queryKey: ['all-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-alerts'] });
      toast.success('Todas as notificações marcadas como lidas');
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-alerts'] });
      toast.success('Notificação excluída');
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });

  // Delete all alerts mutation
  const deleteAllAlertsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq with impossible ID)
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-alerts'] });
      toast.success('Todas as notificações foram excluídas');
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });

  const formatAlertTime = (sentAt: string) => {
    return formatDistanceToNow(new Date(sentAt), { addSuffix: true, locale: ptBR });
  };

  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Central de Notificações</h3>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 
              ? `${unreadCount} notificação(ões) não lida(s)` 
              : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Marcar todas como lidas
          </Button>
        )}
        {alerts && alerts.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deleteAllAlertsMutation.isPending}
              >
                {deleteAllAlertsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Limpar tudo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todas as notificações?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todas as {alerts.length} notificações serão excluídas permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAllAlertsMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, limpar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Carregando notificações...</p>
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhuma notificação</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quando houver alertas de saldo baixo, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 hover:bg-muted/30 transition-colors ${
                  !alert.is_read ? 'bg-accent/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.type === "warning" || alert.type === "low_balance" 
                      ? "bg-warning/10" 
                      : alert.type === "critical" 
                      ? "bg-destructive/10"
                      : "bg-success/10"
                  }`}>
                    {alert.type === "warning" || alert.type === "low_balance" || alert.type === "critical" ? (
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.type === "critical" ? "text-destructive" : "text-warning"
                      }`} />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">{alert.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!alert.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(alert.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            Marcar como lida
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                          disabled={deleteAlertMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatAlertTime(alert.sent_at)}
                      </span>
                      {!alert.is_read && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent">
                          Novo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}