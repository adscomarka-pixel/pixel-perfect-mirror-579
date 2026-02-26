import { FileText, Loader2, Trash2, Copy, CheckCircle2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
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

interface Report {
  id: string;
  title: string;
  message: string;
  product_name: string | null;
  period_start: string;
  period_end: string;
  total_investment: number;
  messages_count: number;
  cost_per_message: number;
  is_read: boolean;
  created_at: string;
}

export function ReportNotificationsTab() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch all reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Report[];
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports')
        .update({ is_read: true })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('reports')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Todos os relatórios marcados como lidos');
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Relatório excluído');
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });

  // Delete all reports mutation
  const deleteAllReportsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Todos os relatórios foram excluídos');
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });

  const formatReportTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ptBR });
  };

  const copyToClipboard = async (report: Report) => {
    try {
      await navigator.clipboard.writeText(report.message);
      setCopiedId(report.id);
      toast.success('Mensagem copiada para a área de transferência');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Erro ao copiar mensagem');
    }
  };

  const unreadCount = reports?.filter(r => !r.is_read).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Relatórios Gerados</h3>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} relatório(s) não lido(s)`
              : 'Todos os relatórios foram lidos'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              Marcar todos como lidos
            </Button>
          )}
          {reports && reports.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deleteAllReportsMutation.isPending}
                >
                  {deleteAllReportsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Limpar tudo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar todos os relatórios?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os {reports.length} relatórios serão excluídos permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAllReportsMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, limpar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar relatórios..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Reports List */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Carregando relatórios...</p>
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhum relatório gerado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gere um relatório na aba "Configuração" para vê-lo aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reports
              ?.filter(r =>
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.message.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((report) => (
                <div
                  key={report.id}
                  className={`p-4 hover:bg-muted/30 transition-colors ${!report.is_read ? 'bg-accent/5' : ''
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{report.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>💰 R$ {report.total_investment.toFixed(2)}</span>
                            <span>💬 {report.messages_count.toLocaleString('pt-BR')}</span>
                            <span>📈 R$ {report.cost_per_message.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(report)}
                          >
                            {copiedId === report.id ? (
                              <CheckCircle2 className="w-4 h-4 mr-1 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 mr-1" />
                            )}
                            {copiedId === report.id ? 'Copiado!' : 'Copiar'}
                          </Button>
                          {!report.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(report.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              Marcar como lido
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteReportMutation.mutate(report.id)}
                            disabled={deleteReportMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                          {report.message}
                        </pre>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatReportTime(report.created_at)}
                        </span>
                        {!report.is_read && (
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
