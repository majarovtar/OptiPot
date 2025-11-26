import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, CheckCircle2, Clock, Navigation } from "lucide-react";
import { fetchOrders, type Order } from "@/lib/api";
import { DriverRouteMap } from "@/components/map/DriverRouteMap";

// Define the delivery interface for driver's route
interface DriverDelivery {
  id: string;
  orderId: string;
  address: string;
  packages: number;
  status: "pending" | "completed";
  time: string;
  coordinates: { lng: number; lat: number };
  sequenceNumber: number;
}

export default function DriverView() {
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const driverId = "V001"; // This would normally come from auth/context

  useEffect(() => {
    async function loadDriverRoute() {
      try {
        console.log('Loading driver route...');
        const orders = await fetchOrders();
        console.log('Fetched orders:', orders.length);
        console.log('First order:', orders[0]);
        
        // Simulate getting only this driver's assigned orders
        // In real app, this would come from a driver-specific API endpoint
        const ordersWithCoords = orders.filter(order => order.latitude && order.longitude);
        console.log('Orders with coordinates:', ordersWithCoords);
        
        const driverOrders = ordersWithCoords
          .slice(0, 8) // Get 8 orders for this driver
          .map((order, index) => ({
            id: `DEL-${index + 1}`,
            orderId: order.order_id,
            address: `${order.street} ${order.house_number}, ${order.city || 'Ljubljana'}`,
            packages: Math.ceil(order.weight / 5),
            status: "pending" as const,
            time: order.window_start,
            coordinates: { 
              lng: order.longitude!, 
              lat: order.latitude! 
            },
            sequenceNumber: index + 1
          }));
        
        console.log('Driver orders prepared:', driverOrders.length);
        console.log('First driver order:', driverOrders[0]);
        setDeliveries(driverOrders);
      } catch (error) {
        console.error('Error loading driver route:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDriverRoute();
  }, []);

  const handleComplete = (deliveryId: string) => {
    setDeliveries(prev => prev.filter(delivery => delivery.id !== deliveryId));
  };

  const pendingCount = deliveries.filter(d => d.status === "pending").length;
  const completedCount = deliveries.filter(d => d.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading your route...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Route - {driverId}</h1>
          <p className="text-muted-foreground">
            {pendingCount} deliveries remaining • {completedCount} completed
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-base px-4 py-2">
            <Navigation className="h-4 w-4 mr-2" />
            Route #{driverId}
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            ETA: 2h 15m
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4">
        <div className="h-[calc(100vh-220px)] min-h-[500px]">
          <DriverRouteMap deliveries={deliveries} driverId={driverId} />
        </div>

        <Card className="p-4 h-[calc(100vh-220px)] overflow-y-auto">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Today's Deliveries
          </h2>
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <Card
                key={delivery.id}
                className={`p-4 ${
                  delivery.status === "completed"
                    ? "bg-muted/50"
                    : "bg-card hover:bg-accent/5 transition-colors"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        Stop #{delivery.sequenceNumber}
                      </Badge>
                      <span className="font-semibold text-sm">{delivery.orderId}</span>
                      {delivery.status === "completed" && (
                        <Badge variant="outline" className="text-success border-success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{delivery.address}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      <Package className="h-4 w-4 inline mr-1" />
                      {delivery.packages} packages
                    </span>
                    <span className="text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {delivery.time}
                    </span>
                  </div>
                  {delivery.status === "pending" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleComplete(delivery.id)}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}