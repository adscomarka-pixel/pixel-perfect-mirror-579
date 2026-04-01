import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface GroupSummary {
    id: string;
    user_id: string;
    client_id: string;
    period_days: number;
    period_start: string;
    period_end: string;
    total_messages: number | null;
    summary: string;
    created_at: string;
    client_name?: string;
}

interface N8nWebhookPayload {
    clientName: string;
    whatsappGroupLink: string;
    periodDays: number;
    periodStart: string;
    periodEnd: string;
}

interface N8nWebhookResponse {
    success: boolean;
    data: {
        message: {
            conversation: string;
        };
    };
}

export const useGroupSummary = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Buscar histórico de resumos
    const { data: summaries = [], isLoading } = useQuery({
        queryKey: ["group_summaries"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("group_summaries" as any)
                .select("*, clients(name)")
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) {
                toast.error("Erro ao carregar resumos: " + error.message);
                throw error;
            }

            return (data as any[]).map((item: any) => ({
                ...item,
                client_name: item.clients?.name || "Cliente removido",
            })) as GroupSummary[];
        },
    });

    // Buscar URL do webhook configurada
    const { data: webhookUrl } = useQuery({
        queryKey: ["n8n_webhook_url"],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase
                .from("notification_settings")
                .select("n8n_summary_webhook_url" as any)
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") throw error;
            return (data as any)?.n8n_summary_webhook_url as string | null;
        },
        enabled: !!user?.id,
    });

    // Chamar webhook n8n e salvar resumo
    const generateSummary = useMutation({
        mutationFn: async ({
            clientId,
            clientName,
            whatsappGroupLink,
            periodDays,
        }: {
            clientId: string;
            clientName: string;
            whatsappGroupLink: string;
            periodDays: number;
        }) => {
            if (!webhookUrl) {
                throw new Error("URL do webhook n8n não configurada. Configure nas Configurações.");
            }

            if (!user?.id) {
                throw new Error("Usuário não autenticado");
            }

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - periodDays);

            const formatDate = (date: Date) => date.toISOString().split("T")[0];

            const payload: N8nWebhookPayload = {
                clientName,
                whatsappGroupLink,
                periodDays,
                periodStart: formatDate(startDate),
                periodEnd: formatDate(endDate),
            };

            // Chamar o webhook n8n
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Erro ao chamar webhook: ${response.status} ${response.statusText}`);
            }

            const result: N8nWebhookResponse[] = await response.json();

            if (!result || !Array.isArray(result) || result.length === 0 || !result[0].success) {
                throw new Error("Resposta inválida do webhook n8n");
            }

            const summaryText = result[0].data?.message?.conversation;
            if (!summaryText) {
                throw new Error("Resumo não encontrado na resposta do webhook");
            }

            // Salvar no banco
            const { data: savedSummary, error: saveError } = await supabase
                .from("group_summaries" as any)
                .insert([{
                    user_id: user.id,
                    client_id: clientId,
                    period_days: periodDays,
                    period_start: formatDate(startDate),
                    period_end: formatDate(endDate),
                    total_messages: 0,
                    summary: summaryText,
                }])
                .select()
                .single();

            if (saveError) {
                console.error("Erro ao salvar resumo:", saveError);
                // Retorna o resumo mesmo se falhar ao salvar
                return {
                    summary: summaryText,
                    clientName,
                    periodDays,
                    periodStart: formatDate(startDate),
                    periodEnd: formatDate(endDate),
                };
            }

            return {
                ...(savedSummary as any),
                summary: summaryText,
                clientName,
                periodDays,
                periodStart: formatDate(startDate),
                periodEnd: formatDate(endDate),
            };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group_summaries"] });
            toast.success("Resumo gerado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao gerar resumo");
        },
    });

    // Deletar resumo
    const deleteSummary = useMutation({
        mutationFn: async (summaryId: string) => {
            const { error } = await supabase
                .from("group_summaries" as any)
                .delete()
                .eq("id", summaryId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group_summaries"] });
            toast.success("Resumo excluído!");
        },
        onError: (error: any) => {
            toast.error("Erro ao excluir resumo: " + error.message);
        },
    });

    return {
        summaries,
        isLoading,
        webhookUrl,
        generateSummary,
        deleteSummary,
    };
};
