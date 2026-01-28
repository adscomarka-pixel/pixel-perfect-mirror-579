import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "gestor" | "leitor";

export const useUserRole = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    const checkRole = async () => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setRole((data?.role as AppRole) || null);
      } catch (error) {
        console.error("Error checking user role:", error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();
  }, [user, authLoading]);

  const isAdmin = role === "admin";
  const isGestor = role === "gestor";
  const isLeitor = role === "leitor";
  const canManageReports = role === "admin" || role === "gestor";
  const canManageUsers = role === "admin";

  return { 
    role, 
    isAdmin, 
    isGestor, 
    isLeitor, 
    canManageReports, 
    canManageUsers,
    isLoading 
  };
};
