import { FleetVehicleCard } from "@/components/fleet/FleetVehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowUpDown, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchVehicles, type Vehicle } from "@/lib/api";
import { useState, useEffect } from "react";

type SortOption = "type" | "fuel" | "capacity" | "emissions";
type VehicleType = "all" | "truck" | "bike" | "van";
type FuelType = "all" | "electric" | "diesel";

export default function Fleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("type");
  const [filterType, setFilterType] = useState<VehicleType>("all");
  const [filterFuel, setFilterFuel] = useState<FuelType>("all");

  useEffect(() => {
    async function loadVehicles() {
      try {
        const vehiclesData = await fetchVehicles();
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, []);

  const filteredVehicles = vehicles
    .filter((vehicle) => {
      const matchesSearch = 
        vehicle.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.fuel_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || vehicle.type === filterType;
      const matchesFuel = filterFuel === "all" || vehicle.fuel_type === filterFuel;

      return matchesSearch && matchesType && matchesFuel;
    })
    .sort((a, b) => {
      if (sortBy === "type") {
        return a.type.localeCompare(b.type);
      } else if (sortBy === "fuel") {
        return a.fuel_type.localeCompare(b.fuel_type);
      } else if (sortBy === "capacity") {
        return b.max_capacity_kg - a.max_capacity_kg;
      } else if (sortBy === "emissions") {
        return a.emission_g_co2_per_km - b.emission_g_co2_per_km;
      } else {
        return a.emission_g_co2_per_km - b.emission_g_co2_per_km;
      }
    });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground">Monitor and manage your vehicle fleet</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search vehicles..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">Vehicle Type</SelectItem>
              <SelectItem value="fuel">Fuel Type</SelectItem>
              <SelectItem value="capacity">Capacity</SelectItem>
              <SelectItem value="emissions">Emissions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters:</span>
          </div>
          
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="truck">Trucks</SelectItem>
              <SelectItem value="bike">Bikes</SelectItem>
              <SelectItem value="van">Vans</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterFuel} onValueChange={(value: any) => setFilterFuel(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Fuel Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fuel Types</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
            </SelectContent>
          </Select>

          {(filterType !== "all" || filterFuel !== "all") && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setFilterType("all");
                setFilterFuel("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredVehicles.length} of {vehicles.length} vehicles
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <FleetVehicleCard 
            key={vehicle.vehicle_id}
            vehicle={vehicle}
          />
        ))}
      </div>
    </div>
  );
}
