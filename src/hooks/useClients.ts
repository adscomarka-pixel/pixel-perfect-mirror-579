import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Client {
    id: string;
    user_id: string;
    name: string;
    whatsapp_group_link: string | null;
    enable_balance_check: boolean;
    created_at: string;
    updated_at: string;
}

export const useClients = () => {
    const queryClient = useQueryClient();

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .order("name");

            if (error) {
                toast.error("Erro ao carregar clientes: " + error.message);
                throw error;
            }
            return data as Client[];
        },
    });

    const createClient = useMutation({
        mutationFn: async (newClient: Omit<Client, "id" | "user_id" | "created_at" | "updated_at"> & { name: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("clients")
                .insert([{ ...newClient, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast.success("Cliente criado com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao criar cliente: " + error.message);
        },
    });

    const updateClient = useMutation({
        mutationFn: async (updatedClient: Partial<Client> & { id: string }) => {
            const { data, error } = await supabase
                .from("clients")
                .update(updatedClient)
                .eq("id", updatedClient.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast.success("Cliente atualizado com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao atualizar cliente: " + error.message);
        },
    });

    const deleteClient = useMutation({
        mutationFn: async (clientId: string) => {
            const { error } = await supabase
                .from("clients")
                .delete()
                .eq("id", clientId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["ad_accounts"] });
            toast.success("Cliente excluído com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao excluir cliente: " + error.message);
        },
    });

    const linkAccount = useMutation({
        mutationFn: async ({ accountId, clientId }: { accountId: string; clientId: string }) => {
            const { error } = await supabase
                .from("ad_accounts")
                .update({ client_id: clientId })
                .eq("id", accountId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ad_accounts"] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast.success("Conta vinculada com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao vincular conta: " + error.message);
        },
    });

    const unlinkAccount = useMutation({
        mutationFn: async (accountId: string) => {
            const { error } = await supabase
                .from("ad_accounts")
                .update({ client_id: null })
                .eq("id", accountId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ad_accounts"] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast.success("Conta desvinculada com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao desvincular conta: " + error.message);
        },
    });

    return {
        clients,
        isLoading,
        createClient,
        updateClient,
        deleteClient,
        linkAccount,
        unlinkAccount,
    };
};
