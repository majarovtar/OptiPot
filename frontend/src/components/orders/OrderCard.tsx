import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Clock, Weight } from "lucide-react";
import { type Order } from "@/lib/api";

interface OrderCardProps {
  order: Order;
}

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case "express":
      return "bg-destructive text-destructive-foreground";
    case "urgent":
      return "bg-orange-500 text-white";
    case "standard":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case "delivered":
      return "bg-green-500 text-white";
    case "in-transit":
      return "bg-blue-500 text-white";
    case "assigned":
      return "bg-yellow-500 text-white";
    case "pending":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const OrderCard = ({ order }: OrderCardProps) => {
  const fullAddress = [
    order.street,
    order.house_number,
    order.postal_code,
    order.city,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {order.order_id}
          </CardTitle>
          <Badge className={getPriorityBadgeClass(order.priority)}>
            {order.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Weight className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground font-medium">{order.weight} kg</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {order.window_start} - {order.window_end}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="text-muted-foreground line-clamp-2">
            {fullAddress || "Address not specified"}
          </span>
        </div>

        {order.status && (
          <div className="pt-2 border-t border-border">
            <Badge className={getStatusBadgeClass(order.status)}>
              {order.status}
            </Badge>
          </div>
        )}

        {order.assignedVehicle && (
          <div className="text-xs text-muted-foreground">
            Vehicle: {order.assignedVehicle}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
