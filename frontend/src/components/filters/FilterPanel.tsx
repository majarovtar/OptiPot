import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw } from "lucide-react";
import { useState } from "react";

interface FilterPanelProps {
  onFiltersApplied?: (filters: any) => void;
}

export const FilterPanel = ({ onFiltersApplied }: FilterPanelProps) => {
  const [filters, setFilters] = useState({
  lowCarbon: false,
  evPriority: false,
  emissionZones: false,

  costOptimization: "balanced",
  avoidTolls: false,
  fuelEfficiency: false,

  fuelType: "diesel",
  vehicleCapacity: "medium",

  avoidTraffic: true,
  timeWindows: true,
});

const applyFilters = async () => {
  console.log("Applied Filters:", filters);
  console.log("onFiltersApplied callback exists:", !!onFiltersApplied);
  
  // Notify parent component
  if (onFiltersApplied) {
    console.log("Calling onFiltersApplied with filters");
    onFiltersApplied(filters);
  }
  
  try {
    const response = await fetch("http://localhost:8000/run-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });

    const result = await response.json();
    console.log("Python result:", result);

  } catch (error) {
    console.error("Error sending filters:", error);
  }
};
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Route Optimization</h2>
        </div>
        <Button variant="ghost" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <Separator />

      {/* Environmental Filters */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Environmental</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="low-carbon" className="text-sm">Low Carbon Footprint</Label>
            <Switch id="low-carbon" checked={filters.lowCarbon} onCheckedChange={(val) => setFilters({ ...filters, lowCarbon: val })}/>
          </div>
        </div>
      </div>

      <Separator />

      {/* Economic Filters */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Economic</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="cost-optimization" className="text-sm">Cost Optimization</Label>
            <Select defaultValue="balanced" value={filters.costOptimization} onValueChange={(val) => setFilters({ ...filters, costOptimization: val })}>
              <SelectTrigger id="cost-optimization">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lowest">Lowest Cost</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="fastest">Fastest Route</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="toll-avoidance" className="text-sm">Avoid Tolls</Label>
            <Switch id="toll-avoidance" checked={filters.avoidTolls} onCheckedChange={(val) => setFilters({ ...filters, avoidTolls: val })}/>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="fuel-efficiency" className="text-sm">Fuel Efficiency Priority</Label>
            <Switch id="fuel-efficiency" checked={filters.fuelEfficiency} onCheckedChange={(val) => setFilters({ ...filters, fuelEfficiency: val })}/>
          </div>
        </div>
      </div>

      <Separator />

      {/* Vehicle Specifications */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Vehicle Type</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="fuel-type" className="text-sm">Fuel Type</Label>
            <Select defaultValue="diesel" value={filters.fuelType} onValueChange={(val) => setFilters({ ...filters, fuelType: val })}>
              <SelectTrigger id="fuel-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="gasoline">Gasoline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle-capacity" className="text-sm">Vehicle Capacity</Label>
            <Select defaultValue="medium" value={filters.costOptimization} onValueChange={(val) => setFilters({ ...filters, costOptimization: val })}>
              <SelectTrigger id="vehicle-capacity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (up to 1t)</SelectItem>
                <SelectItem value="medium">Medium (1-3t)</SelectItem>
                <SelectItem value="large">Large (3-7t)</SelectItem>
                <SelectItem value="xlarge">Extra Large (7t+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Performance Filters */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Performance</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="traffic-avoidance" className="text-sm">Avoid Traffic</Label>
            <Switch id="traffic-avoidance" defaultChecked checked={filters.avoidTraffic} onCheckedChange={(val) => setFilters({ ...filters, avoidTraffic: val })}/>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="time-windows" className="text-sm">Respect Time Windows</Label>
            <Switch id="time-windows" defaultChecked checked={filters.timeWindows} onCheckedChange={(val) => setFilters({ ...filters, timeWindows: val })}/>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Button className="w-full" onClick={applyFilters}>Apply Filters</Button>
        {filters.avoidTolls && (
          <p className="text-xs text-muted-foreground text-center">
            ℹ️ Toll avoidance will be applied to routes
          </p>
        )}
      </div>
    </Card>
  );
};
