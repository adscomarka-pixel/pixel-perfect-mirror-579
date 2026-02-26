import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Search,
    Trash2,
    Check,
    ChevronsUpDown,
    ExternalLink,
    Loader2,
    UserPlus,
    User,
    Smartphone,
    AlertCircle,
    Link2,
    Unlink2,
    Settings2,
    Settings
} from "lucide-react";
import { useClients, type Client } from "@/hooks/useClients";
import { useAdAccounts, type AdAccount } from "@/hooks/useAdAccounts";
import { useAccountManagers } from "@/hooks/useAccountManagers";
import { AccountConfigDialog } from "@/components/dashboard/AccountConfigDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Clients = () => {
    const { clients, isLoading, createClient, updateClient, deleteClient, linkAccount, unlinkAccount } = useClients();
    const { accounts, isLoading: isLoadingAccounts } = useAdAccounts();
    const { managers } = useAccountManagers();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [newClient, setNewClient] = useState({ name: "", whatsapp_group_link: "", enable_balance_check: true, manager_id: "" });

    // Link account state
    const [linkPlatform, setLinkPlatform] = useState<"meta" | "google">("meta");
    const [isComboOpen, setIsComboOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [accountToConfig, setAccountToConfig] = useState<AdAccount | null>(null);

    const handleOpenConfig = (account: AdAccount) => {
        setAccountToConfig(account);
        setIsConfigOpen(true);
    };

    const handleCreateClient = () => {
        if (!newClient.name) {
            toast.error("O nome do cliente é obrigatório");
            return;
        }
        const clientData = {
            ...newClient,
            manager_id: newClient.manager_id === "none" || !newClient.manager_id ? null : newClient.manager_id
        };
        createClient.mutate(clientData, {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                setNewClient({ name: "", whatsapp_group_link: "", enable_balance_check: true, manager_id: "" });
            }
        });
    };


    const handleLinkAccount = () => {
        if (!selectedClientId || !selectedAccountId) return;
        linkAccount.mutate({ accountId: selectedAccountId, clientId: selectedClientId }, {
            onSuccess: () => {
                setIsLinkDialogOpen(false);
                setSelectedAccountId("");
            }
        });
    };

    const orphanAccounts = accounts.filter(acc => !acc.client_id && acc.platform === linkPlatform && !acc.is_manager);
    const activeOrphanAccounts = orphanAccounts.filter(acc => acc.status === 'active');
    const inactiveOrphanAccounts = orphanAccounts.filter(acc => acc.status !== 'active');

    const getClientAccounts = (clientId: string) => {
        return accounts.filter(acc => acc.client_id === clientId);
    };

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestão de Clientes</h1>
                    <p className="text-muted-foreground">Agrupe suas contas de anúncios e gerencie automações por cliente</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="hero">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Novo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Cliente</DialogTitle>
                            <DialogDescription>
                                Adicione um novo cliente para agrupar suas contas de anúncios.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Cliente/Empresa</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: CMK Performance"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">Link do Grupo WhatsApp (Opcional)</Label>
                                <Input
                                    id="whatsapp"
                                    placeholder="https://chat.whatsapp.com/..."
                                    value={newClient.whatsapp_group_link}
                                    onChange={(e) => setNewClient({ ...newClient, whatsapp_group_link: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manager">Gestor Responsável</Label>
                                <Select
                                    value={newClient.manager_id}
                                    onValueChange={(val) => setNewClient({ ...newClient, manager_id: val })}
                                >
                                    <SelectTrigger id="manager">
                                        <SelectValue placeholder="Selecione um gestor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {managers.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label>Verificação de Saldo</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Ativar automação de saldo para este cliente
                                    </p>
                                </div>
                                <Switch
                                    checked={newClient.enable_balance_check}
                                    onCheckedChange={(checked) => setNewClient({ ...newClient, enable_balance_check: checked })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreateClient} disabled={createClient.isPending}>
                                {createClient.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Criar Cliente
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Carregando seus clientes...</p>
                </div>
            ) : clients.length === 0 ? (
                <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <UserPlus className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="mb-2">Nenhum cliente cadastrado</CardTitle>
                    <CardDescription className="max-w-md mb-6">
                        Comece criando seu primeiro cliente para organizar suas contas de anúncios e configurar alertas específicos.
                    </CardDescription>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        Criar Primeiro Cliente
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {clients.map((client) => {
                        const clientAccounts = getClientAccounts(client.id);
                        return (
                            <Card key={client.id} className="overflow-hidden border-border/60 hover:border-primary/40 transition-colors shadow-sm">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant={client.enable_balance_check ? "success" : "secondary"} className="font-medium">
                                            {client.enable_balance_check ? "Saldo Ativo" : "Saldo Inativo"}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => {
                                                    const name = prompt("Novo nome:", client.name);
                                                    if (name) updateClient.mutate({ id: client.id, name });
                                                }}
                                            >
                                                <Settings2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) {
                                                        deleteClient.mutate(client.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{client.name}</CardTitle>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                {client.whatsapp_group_link ? (
                                                    <a
                                                        href={client.whatsapp_group_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                                                    >
                                                        <Smartphone className="w-3 h-3" />
                                                        WhatsApp
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Smartphone className="w-3 h-3" />
                                                        Sem WhatsApp
                                                    </span>
                                                )}

                                                {client.manager_id ? (
                                                    <span className="text-xs text-indigo-500 font-medium flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {managers.find(m => m.id === client.manager_id)?.name || "Gestor não encontrado"}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        Sem Gestor
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    {/* Manager Change Selection */}
                                    <div className="flex items-center justify-between pb-4 border-b">
                                        <div className="space-y-0.5">
                                            <Label className="text-xs text-muted-foreground">Gestor Responsável</Label>
                                            <Select
                                                value={client.manager_id || "none"}
                                                onValueChange={(val) => updateClient.mutate({ id: client.id, manager_id: val === "none" ? null : val })}
                                            >
                                                <SelectTrigger className="h-8 w-[180px] text-xs">
                                                    <SelectValue placeholder="Selecionar gestor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhum</SelectItem>
                                                    {managers.map((m) => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <Link2 className="w-4 h-4" />
                                            Contas Vinculadas ({clientAccounts.length})
                                        </h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedClientId(client.id);
                                                setIsLinkDialogOpen(true);
                                            }}
                                            className="h-8"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Vincular Conta
                                        </Button>
                                    </div>

                                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                        {clientAccounts.length === 0 ? (
                                            <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
                                                <p className="text-sm text-muted-foreground">Nenhuma conta vinculada</p>
                                            </div>
                                        ) : (
                                            clientAccounts.map((account) => (
                                                <div
                                                    key={account.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3 truncate">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full flex-shrink-0",
                                                            account.platform === 'meta' ? "bg-blue-500" : "bg-red-500"
                                                        )} />
                                                        <div className="truncate">
                                                            <p className="text-sm font-medium truncate">{account.account_name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase">{account.platform}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                            onClick={() => handleOpenConfig(account)}
                                                            title="Configurar Conta"
                                                        >
                                                            <Settings className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                            onClick={() => unlinkAccount.mutate(account.id)}
                                                            title="Desvincular Conta"
                                                        >
                                                            <Unlink2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm">Verificar Saldo</Label>
                                            <p className="text-[10px] text-muted-foreground">Monitoramento automático</p>
                                        </div>
                                        <Switch
                                            checked={client.enable_balance_check}
                                            onCheckedChange={(checked) => updateClient.mutate({ id: client.id, enable_balance_check: checked })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Linking Dialog */}
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Vincular Conta de Anúncios</DialogTitle>
                        <DialogDescription>
                            Selecione uma conta órfã para vincular ao cliente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Plataforma</Label>
                            <Select value={linkPlatform} onValueChange={(val: "meta" | "google") => setLinkPlatform(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a plataforma" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="meta">Meta Ads</SelectItem>
                                    <SelectItem value="google">Google Ads</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Selecionar Conta</Label>
                            <Popover open={isComboOpen} onOpenChange={setIsComboOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isComboOpen}
                                        className="w-full justify-between"
                                    >
                                        {selectedAccountId
                                            ? accounts.find((acc) => acc.id === selectedAccountId)?.account_name
                                            : "Buscar conta..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[370px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Digite o nome da conta..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                                            {activeOrphanAccounts.length > 0 && (
                                                <CommandGroup heading="Contas Ativas">
                                                    {activeOrphanAccounts.map((acc) => (
                                                        <CommandItem
                                                            key={acc.id}
                                                            value={acc.account_name}
                                                            onSelect={() => {
                                                                setSelectedAccountId(acc.id);
                                                                setIsComboOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedAccountId === acc.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {acc.account_name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                            {inactiveOrphanAccounts.length > 0 && (
                                                <CommandGroup heading="Contas Inativas/Outros">
                                                    {inactiveOrphanAccounts.map((acc) => (
                                                        <CommandItem
                                                            key={acc.id}
                                                            value={acc.account_name}
                                                            onSelect={() => {
                                                                setSelectedAccountId(acc.id);
                                                                setIsComboOpen(false);
                                                            }}
                                                            className="opacity-60"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedAccountId === acc.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {acc.account_name} (Inativa)
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleLinkAccount} disabled={!selectedAccountId || linkAccount.isPending}>
                            {linkAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Vincular Conta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Account Config Dialog */}
            <AccountConfigDialog
                account={accountToConfig}
                open={isConfigOpen}
                onOpenChange={setIsConfigOpen}
            />
        </DashboardLayout>
    );
};

export default Clients;
