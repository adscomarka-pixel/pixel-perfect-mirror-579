import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AccountManager {
    id: string;
    user_id: string;
    name: string;
    notion_id: string | null;
    created_at: string;
    updated_at: string;
}

export const useAccountManagers = () => {
    const queryClient = useQueryClient();

    const { data: managers = [], isLoading } = useQuery({
        queryKey: ["account_managers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("account_managers")
                .select("*")
                .order("name");

            if (error) {
                toast.error("Erro ao carregar gestores: " + error.message);
                throw error;
            }
            return data as AccountManager[];
        },
    });

    const createManager = useMutation({
        mutationFn: async (newManager: Omit<AccountManager, "id" | "user_id" | "created_at" | "updated_at">) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("account_managers")
                .insert([{ ...newManager, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["account_managers"] });
            toast.success("Gestor criado com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao criar gestor: " + error.message);
        },
    });

    const updateManager = useMutation({
        mutationFn: async (updatedManager: Partial<AccountManager> & { id: string }) => {
            const { data, error } = await supabase
                .from("account_managers")
                .update(updatedManager)
                .eq("id", updatedManager.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["account_managers"] });
            toast.success("Gestor atualizado com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao atualizar gestor: " + error.message);
        },
    });

    const deleteManager = useMutation({
        mutationFn: async (managerId: string) => {
            const { error } = await supabase
                .from("account_managers")
                .delete()
                .eq("id", managerId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["account_managers"] });
            toast.success("Gestor excluído com sucesso!");
        },
        onError: (error: any) => {
            toast.error("Erro ao excluir gestor: " + error.message);
        },
    });

    return {
        managers,
        isLoading,
        createManager,
        updateManager,
        deleteManager,
    };
};
