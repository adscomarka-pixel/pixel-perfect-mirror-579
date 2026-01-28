import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Loader2, 
  Settings2, 
  TrendingUp,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function ReportConfigTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [productName, setProductName] = useState("");
  const [periodDays, setPeriodDays] = useState("7");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch notification settings for default product name
  const { data: settings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('default_product_name')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Update default product name
  const updateProductNameMutation = useMutation({
    mutationFn: async (newProductName: string) => {
      const { error } = await supabase
        .from('notification_settings')
        .update({ default_product_name: newProductName })
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Nome do produto atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          productName: productName || settings?.default_product_name || 'Meu Produto',
          periodDays: parseInt(periodDays),
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Relatório gerado com sucesso!', {
        description: `Investimento total: R$ ${data.summary.totalInvestment.toFixed(2)}`
      });
    },
    onError: (error) => {
      toast.error('Erro ao gerar relatório: ' + error.message);
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  return (
    <div className="space-y-6">
      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Relatório de Campanhas</h3>
              <p className="text-sm text-muted-foreground">Impressões, cliques, CTR, conversões</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Relatório de Saldo</h3>
              <p className="text-sm text-muted-foreground">Saldos, recargas, projeção de consumo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Configuração do Relatório</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName">Nome do Produto</Label>
            <div className="flex gap-2">
              <Input
                id="productName"
                placeholder={settings?.default_product_name || 'Ex: Campanha de Leads'}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  if (productName) {
                    updateProductNameMutation.mutate(productName);
                  }
                }}
                disabled={!productName || updateProductNameMutation.isPending}
              >
                {updateProductNameMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Salvar como padrão'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Este nome aparecerá no relatório gerado
            </p>
          </div>

          {/* Period Selection */}
          <div className="space-y-2">
            <Label htmlFor="period">Período do Relatório</Label>
            <Select value={periodDays} onValueChange={setPeriodDays}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <div className="pt-4 border-t border-border">
            <Button 
              variant="hero"
              size="lg"
              onClick={() => generateReportMutation.mutate()}
              disabled={isGenerating}
              className="w-full md:w-auto"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Gerando Relatório...' : 'Gerar Relatório Agora'}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Format Preview */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Prévia do Formato</h3>
        </div>
        <div className="p-6">
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-4">
{`Bom dia,

Segue o relatório geral de desempenho da semana passada (Segunda a Domingo)

Produto: ${productName || settings?.default_product_name || 'Meu Produto'}

📅 Período analisado: Últimos ${periodDays} dias 

💰 Investimento total: R$ X.XXX,XX 

💬 Mensagens iniciadas: X.XXX

📈 Custo por mensagens: R$ X,XX

Vamo pra cima!! 🚀`}
          </pre>
        </div>
      </div>
    </div>
  );
}
