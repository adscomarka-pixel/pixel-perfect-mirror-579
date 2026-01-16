import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Webhook, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Settings2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface WebhookIntegration {
  id: string;
  name: string;
  webhook_url: string;
  is_active: boolean;
  trigger_on_low_balance: boolean;
  trigger_on_token_expiry: boolean;
}

export function IntegrationsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: "", webhook_url: "" });
  const [testingId, setTestingId] = useState<string | null>(null);

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhook-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_integrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WebhookIntegration[];
    },
  });

  // Create webhook mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; webhook_url: string }) => {
      const { error } = await supabase
        .from('webhook_integrations')
        .insert({
          user_id: user?.id,
          name: data.name || 'n8n Webhook',
          webhook_url: data.webhook_url,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-integrations'] });
      toast.success('Webhook adicionado com sucesso');
      setIsDialogOpen(false);
      setNewWebhook({ name: "", webhook_url: "" });
    },
    onError: (error) => {
      toast.error('Erro ao adicionar webhook: ' + error.message);
    }
  });

  // Delete webhook mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_integrations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-integrations'] });
      toast.success('Webhook removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    }
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('webhook_integrations')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-integrations'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Toggle trigger mutation
  const toggleTriggerMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from('webhook_integrations')
        .update({ [field]: value })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-integrations'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Test webhook
  const testWebhook = async (webhook: WebhookIntegration) => {
    setTestingId(webhook.id);
    try {
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          message: 'Teste de conexão do CMK Performance',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Webhook testado com sucesso!');
      } else {
        toast.error(`Erro no webhook: ${response.status}`);
      }
    } catch (error) {
      toast.error('Erro ao testar webhook. Verifique a URL.');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Integrações via Webhook (n8n)</h3>
          <p className="text-sm text-muted-foreground">
            Configure webhooks para enviar alertas para o n8n e integrar com WhatsApp, Telegram, etc.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Webhook</DialogTitle>
              <DialogDescription>
                Cole a URL do webhook do seu workflow n8n para receber alertas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome (opcional)</Label>
                <Input
                  id="name"
                  placeholder="Ex: WhatsApp Alertas"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL do Webhook *</Label>
                <Input
                  id="url"
                  placeholder="https://n8n.seudominio.com/webhook/..."
                  value={newWebhook.webhook_url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, webhook_url: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createMutation.mutate(newWebhook)}
                disabled={!newWebhook.webhook_url || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <div className="bg-accent/5 rounded-xl border border-accent/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Webhook className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Como usar com n8n</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Crie um workflow no n8n com um nó "Webhook" como trigger</li>
              <li>Copie a URL do webhook gerada pelo n8n</li>
              <li>Cole a URL aqui e ative a integração</li>
              <li>Configure o n8n para enviar mensagens para WhatsApp, Telegram, Email, etc.</li>
            </ol>
            <a 
              href="https://n8n.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline mt-3"
            >
              Saiba mais sobre o n8n
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border">
          <h4 className="font-semibold text-foreground">Webhooks Configurados</h4>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : !webhooks || webhooks.length === 0 ? (
          <div className="p-12 text-center">
            <Webhook className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhum webhook configurado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione um webhook para começar a receber alertas externamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      webhook.is_active ? 'bg-success/10' : 'bg-muted'
                    }`}>
                      {webhook.is_active ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{webhook.name}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          webhook.is_active 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {webhook.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {webhook.webhook_url}
                      </p>
                      
                      {/* Trigger Settings */}
                      <div className="flex items-center gap-6 mt-3">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={webhook.trigger_on_low_balance}
                            onCheckedChange={(checked) => 
                              toggleTriggerMutation.mutate({ 
                                id: webhook.id, 
                                field: 'trigger_on_low_balance', 
                                value: checked 
                              })
                            }
                          />
                          <span className="text-muted-foreground">Saldo baixo</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={webhook.trigger_on_token_expiry}
                            onCheckedChange={(checked) => 
                              toggleTriggerMutation.mutate({ 
                                id: webhook.id, 
                                field: 'trigger_on_token_expiry', 
                                value: checked 
                              })
                            }
                          />
                          <span className="text-muted-foreground">Token expirando</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(webhook)}
                      disabled={testingId === webhook.id}
                    >
                      {testingId === webhook.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Testar'
                      )}
                    </Button>
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={(checked) => 
                        toggleMutation.mutate({ id: webhook.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(webhook.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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