import { FilterPanel } from "@/components/filters/FilterPanel";
import { RouteMap } from "@/components/map/RouteMap";
import { Button } from "@/components/ui/button";
import { Navigation, Download } from "lucide-react";
import { useState, useCallback } from "react";

export default function RoutePlanner() {
  const [routeFilters, setRouteFilters] = useState({
    avoidTolls: false,
    avoidTraffic: true,
    lowCarbon: false,
    evPriority: false,
  });

  const handleFiltersApplied = useCallback((filters: any) => {
    console.log('RoutePlanner received filters:', filters);
    const newRouteFilters = {
      avoidTolls: filters.avoidTolls,
      avoidTraffic: filters.avoidTraffic,
      lowCarbon: filters.lowCarbon,
      evPriority: filters.evPriority,
    };
    console.log('Setting route filters to:', newRouteFilters);
    setRouteFilters(newRouteFilters);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Route Optimization</h1>
          <p className="text-muted-foreground">Plan and optimize delivery routes with advanced filters</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Navigation className="h-4 w-4 mr-2" />
            Save Routes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-6">
        <div className="order-2 lg:order-1">
          <FilterPanel onFiltersApplied={handleFiltersApplied} />
        </div>
        <div className="order-1 lg:order-2 h-[600px]">
          <RouteMap filters={routeFilters} />
        </div>
      </div>
    </div>
  );
}
