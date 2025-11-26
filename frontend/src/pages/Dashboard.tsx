import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Truck, Package, TrendingDown, Zap } from "lucide-react";
import { fetchOrders, fetchVehicles, type Order, type Vehicle } from "@/lib/api";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vehiclesData, ordersData] = await Promise.all([
          fetchVehicles(),
          fetchOrders()
        ]);
        setVehicles(vehiclesData);
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalVehicles = vehicles.length;
  const electricVehicles = vehicles.filter(v => v.fuel_type === "electric").length;
  const totalOrders = orders.length;
  const expressOrders = orders.filter(o => o.priority === "express").length;
  
  const totalEmissions = vehicles.reduce((sum, v) => sum + v.emission_g_co2_per_km, 0);
  const avgEmissions = totalVehicles > 0 ? (totalEmissions / totalVehicles).toFixed(0) : "0";
  
  const electricPercentage = totalVehicles > 0 ? ((electricVehicles / totalVehicles) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your fleet performance and delivery metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Vehicles"
          value={totalVehicles.toString()}
          change={`${electricVehicles} electric vehicles`}
          changeType="positive"
          icon={Truck}
          variant="default"
        />
        <MetricCard
          title="Pending Orders"
          value={totalOrders.toString()}
          change={`${expressOrders} express deliveries`}
          changeType="neutral"
          icon={Package}
          variant="success"
        />
        <MetricCard
          title="Avg. Emissions"
          value={`${avgEmissions} g CO₂/km`}
          change={`${electricPercentage}% electric fleet`}
          changeType="positive"
          icon={TrendingDown}
          variant="info"
        />
        <MetricCard
          title="Fleet Capacity"
          value={`${(vehicles.reduce((sum, v) => sum + v.max_capacity_kg, 0) / 1000).toFixed(1)}t`}
          change="Total capacity available"
          changeType="neutral"
          icon={Zap}
          variant="warning"
        />
      </div>
    </div>
  );
}
