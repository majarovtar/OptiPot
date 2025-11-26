import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Bike, Car } from "lucide-react";
import { type Vehicle } from "@/lib/api";

interface FleetVehicleCardProps {
  vehicle: Vehicle;
}

const vehicleIcons = {
  truck: Truck,
  bike: Bike,
  van: Car,
};

const statusConfig = {
  in_garage: { label: "In Garage", variant: "secondary" as const },
  delivering: { label: "Delivering", variant: "default" as const },
  offline: { label: "Offline", variant: "outline" as const },
  online: { label: "Online", variant: "default" as const },
  broken: { label: "Broken", variant: "destructive" as const },
};

export const FleetVehicleCard = ({ vehicle }: FleetVehicleCardProps) => {
  const VehicleIcon = vehicleIcons[vehicle.type];

  return (
    <Card className="p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <VehicleIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)} {vehicle.vehicle_id}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.fuel_type}</p>
          </div>
        </div>
        <Badge className={vehicle.fuel_type === "electric" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}>
          {vehicle.fuel_type}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Max Capacity</span>
          <span className="font-medium text-foreground">{vehicle.max_capacity_kg} kg</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Emissions</span>
          <span className="font-medium text-foreground">{vehicle.emission_g_co2_per_km} g CO₂/km</span>
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full mt-4">
        View Details
      </Button>
    </Card>
  );
};
