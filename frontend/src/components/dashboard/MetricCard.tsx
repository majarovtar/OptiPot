import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "info";
}

export const MetricCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
}: MetricCardProps) => {
  const variantStyles = {
    default: "border-l-primary",
    success: "border-l-success",
    warning: "border-l-warning",
    info: "border-l-info",
  };

  const iconColors = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
  };

  return (
    <Card className={cn("p-6 border-l-4 transition-all hover:shadow-lg", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg bg-muted", iconColors[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};
