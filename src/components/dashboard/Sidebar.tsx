import { cn } from "@/lib/utils";
import { BarChart3, Bell, ChevronLeft, ChevronRight, FileText, Home, Key, Link2, LogOut, Settings, Users } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "@/hooks/useSidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const baseNavigation = [
  { name: "Visão Geral", href: "/dashboard", icon: Home },
  { name: "Relatórios", href: "/dashboard/reports", icon: FileText },
  { name: "Alertas", href: "/dashboard/alerts", icon: Bell },
  { name: "Contas", href: "/dashboard/accounts", icon: Link2 },
  { name: "Tokens", href: "/dashboard/tokens", icon: Key },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Usuários", href: "/dashboard/users", icon: Users },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { isCollapsed, toggle } = useSidebar();
  const [profile, setProfile] = useState<{ full_name: string | null; company_name: string | null } | null>(null);

  const navigation = isAdmin 
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, company_name")
          .eq("user_id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn("p-4", isCollapsed ? "px-3" : "p-6")}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span 
              className={cn(
                "font-bold text-lg text-sidebar-foreground whitespace-nowrap transition-all duration-300",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              CMK Performance
            </span>
          </Link>
        </div>

        {/* Toggle Button */}
        <div className={cn("px-3 mb-2", isCollapsed ? "flex justify-center" : "flex justify-end")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-hidden">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const linkContent = (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span 
                  className={cn(
                    "whitespace-nowrap transition-all duration-300",
                    isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3 p-2",
            isCollapsed && "justify-center p-0"
          )}>
            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleLogout}
                    className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-accent/80 transition-colors"
                    title="Sair"
                  >
                    <span className="text-sm font-semibold text-sidebar-accent-foreground">
                      {getInitials()}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  <p>{profile?.full_name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs mt-1">Clique para sair</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-sidebar-accent-foreground">
                    {getInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile?.full_name || "Usuário"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user?.email || ""}
                  </p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
