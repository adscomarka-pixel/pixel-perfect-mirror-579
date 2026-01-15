import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  badge?: {
    text: string;
    variant: "success" | "warning" | "danger";
  };
}

const badgeVariants = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-accent",
  iconBgColor = "bg-accent/10",
  badge,
}: StatsCardProps) {
  return (
    <div className="stat-card group hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBgColor)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {badge && (
          <span className={cn("px-2 py-1 text-xs font-medium rounded-full", badgeVariants[badge.variant])}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
