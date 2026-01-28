import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

type AppRole = "admin" | "gestor" | "leitor";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  phone?: string | null;
  created_at: string;
  role?: AppRole;
}

interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<AppRole>("leitor");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setCompanyName(user.company_name || "");
      setPhone(user.phone || "");
      setRole(user.role || "leitor");
      setEmail("");
      setPassword("");
    }
  }, [user]);

  // Update profile via edge function
  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user selected");

      const updates: Record<string, string | undefined> = {
        userId: user.user_id,
        fullName,
        companyName,
        phone,
      };

      // Only include email/password if provided
      if (email.trim()) updates.email = email.trim();
      if (password.trim()) updates.password = password.trim();

      const { data, error } = await supabase.functions.invoke("update-user", {
        body: updates,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      console.error("Error updating user:", error);
      throw error;
    },
  });

  // Update role
  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user selected");

      // First, delete existing role
      await supabase.from("user_roles").delete().eq("user_id", user.user_id);

      // Then insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.user_id, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      console.error("Error updating role:", error);
      throw error;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Update profile/auth data
      await updateUserMutation.mutateAsync();

      // Update role if changed
      if (role !== user?.role) {
        await updateRoleMutation.mutateAsync();
      }

      toast.success("Usuário atualizado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário. Deixe os campos de email e senha em branco para manter os valores atuais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome completo</Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-company">Empresa</Label>
            <Input
              id="edit-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Credenciais de acesso (deixe em branco para manter)
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Novo email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="novo@email.com"
              />
            </div>

            <div className="space-y-2 mt-3">
              <Label htmlFor="edit-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha (mínimo 6 caracteres)"
                  minLength={password ? 6 : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label>Função</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as AppRole)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="edit-role-admin" />
                <Label htmlFor="edit-role-admin" className="font-normal cursor-pointer">
                  <span className="font-medium">Administrador</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    - Acesso completo
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gestor" id="edit-role-gestor" />
                <Label htmlFor="edit-role-gestor" className="font-normal cursor-pointer">
                  <span className="font-medium">Gestor</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    - Relatórios e alertas
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="leitor" id="edit-role-leitor" />
                <Label htmlFor="edit-role-leitor" className="font-normal cursor-pointer">
                  <span className="font-medium">Leitor</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    - Apenas visualização
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
