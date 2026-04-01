import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MessageSquareText,
    Loader2,
    Sparkles,
    Calendar,
    Clock,
    Trash2,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Settings,
    Users,
    Smartphone,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useGroupSummary } from "@/hooks/useGroupSummary";
import { useNavigate } from "react-router-dom";

const PERIOD_OPTIONS = [
    { value: "3", label: "Últimos 3 dias" },
    { value: "7", label: "Últimos 7 dias" },
    { value: "15", label: "Últimos 15 dias" },
    { value: "30", label: "Últimos 30 dias" },
];

/**
 * Converte markdown estilo WhatsApp para HTML simples
 * *bold* → <strong>bold</strong>
 * _italic_ → <em>italic</em>
 */
function formatWhatsAppText(text: string): string {
    return text
        // Bold: *text*
        .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
        // Italic: _text_
        .replace(/_(.*?)_/g, "<em>$1</em>")
        // Line breaks
        .replace(/\n/g, "<br />");
}

const GroupSummary = () => {
    const navigate = useNavigate();
    const { clients, isLoading: isLoadingClients } = useClients();
    const { summaries, isLoading: isLoadingSummaries, webhookUrl, generateSummary, deleteSummary } = useGroupSummary();

    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [selectedPeriod, setSelectedPeriod] = useState<string>("7");
    const [currentSummary, setCurrentSummary] = useState<string | null>(null);
    const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);

    // Filtrar apenas clientes com link do WhatsApp
    const eligibleClients = clients.filter((c) => c.whatsapp_group_link);
    const selectedClient = clients.find((c) => c.id === selectedClientId);

    const handleGenerate = () => {
        if (!selectedClientId || !selectedClient) return;

        setCurrentSummary(null);
        generateSummary.mutate(
            {
                clientId: selectedClientId,
                clientName: selectedClient.name,
                whatsappGroupLink: selectedClient.whatsapp_group_link!,
                periodDays: parseInt(selectedPeriod),
            },
            {
                onSuccess: (data) => {
                    setCurrentSummary(data.summary);
                },
            }
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <MessageSquareText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Resumo de Grupo</h1>
                        <p className="text-muted-foreground">
                            Gere resumos inteligentes das conversas dos grupos de WhatsApp dos seus clientes
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Coluna principal — Formulário e Resultado */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Formulário */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-b border-border/40">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                                Gerar Novo Resumo
                            </CardTitle>
                            <CardDescription>
                                Selecione o cliente e o período para gerar um resumo com IA das conversas do grupo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            {/* Alerta se webhook não configurado */}
                            {!webhookUrl && (
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Webhook não configurado</p>
                                        <p className="text-xs opacity-80">
                                            Configure a URL do webhook n8n nas Configurações para poder gerar resumos.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 h-7 text-xs border-amber-500/30 hover:bg-amber-500/10"
                                            onClick={() => navigate("/dashboard/settings")}
                                        >
                                            <Settings className="w-3 h-3 mr-1" />
                                            Ir para Configurações
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Select de Cliente */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    Cliente
                                </Label>
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                    <SelectTrigger id="client-select">
                                        <SelectValue placeholder="Selecione um cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eligibleClients.length === 0 ? (
                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                Nenhum cliente com link de WhatsApp cadastrado
                                            </div>
                                        ) : (
                                            eligibleClients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Link do grupo (read-only, exibido após seleção) */}
                            {selectedClient?.whatsapp_group_link && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-muted-foreground">
                                        <Smartphone className="w-4 h-4" />
                                        Link do Grupo WhatsApp
                                    </Label>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/60">
                                        <span className="text-sm text-muted-foreground truncate">
                                            {selectedClient.whatsapp_group_link}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Select de Período */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    Período
                                </Label>
                                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                    <SelectTrigger id="period-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PERIOD_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Botão Gerar */}
                            <Button
                                variant="hero"
                                size="lg"
                                className="w-full"
                                onClick={handleGenerate}
                                disabled={
                                    !selectedClientId ||
                                    !webhookUrl ||
                                    generateSummary.isPending
                                }
                            >
                                {generateSummary.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Gerando resumo com IA...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Gerar Resumo
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Resultado do resumo atual */}
                    {(currentSummary || generateSummary.isPending) && (
                        <Card className="border-emerald-500/30 shadow-lg shadow-emerald-500/5 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-500/20">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <MessageSquareText className="w-5 h-5 text-emerald-500" />
                                        Resumo Gerado
                                    </CardTitle>
                                    {selectedClient && (
                                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                                            {selectedClient.name}
                                        </Badge>
                                    )}
                                </div>
                                {selectedClient && (
                                    <CardDescription className="flex items-center gap-4 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Últimos {selectedPeriod} dias
                                        </span>
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="pt-6">
                                {generateSummary.isPending ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                                                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-foreground">Processando com IA...</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Buscando e resumindo as mensagens do grupo
                                            </p>
                                        </div>
                                    </div>
                                ) : currentSummary ? (
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground/90"
                                        dangerouslySetInnerHTML={{
                                            __html: formatWhatsAppText(currentSummary),
                                        }}
                                    />
                                ) : null}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Coluna lateral — Histórico */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            Histórico
                        </h2>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {summaries.length}
                        </Badge>
                    </div>

                    {isLoadingSummaries ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : summaries.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                    <MessageSquareText className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Nenhum resumo gerado ainda
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    Selecione um cliente e gere o primeiro resumo
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 custom-scrollbar">
                            {summaries.map((summary) => {
                                const isExpanded = expandedSummaryId === summary.id;
                                return (
                                    <Card
                                        key={summary.id}
                                        className="border-border/60 hover:border-emerald-500/30 transition-colors overflow-hidden"
                                    >
                                        <div
                                            className="p-4 cursor-pointer"
                                            onClick={() =>
                                                setExpandedSummaryId(isExpanded ? null : summary.id)
                                            }
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {summary.client_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] px-1.5 py-0"
                                                        >
                                                            {summary.period_days} dias
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatDate(summary.period_start)} → {formatDate(summary.period_end)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        {formatDateTime(summary.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm("Excluir este resumo?")) {
                                                                deleteSummary.mutate(summary.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-0 border-t border-border/40">
                                                <div
                                                    className="prose prose-xs dark:prose-invert max-w-none mt-3 text-xs leading-relaxed text-foreground/80"
                                                    dangerouslySetInnerHTML={{
                                                        __html: formatWhatsAppText(summary.summary),
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GroupSummary;
