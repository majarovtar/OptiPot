import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Navigation, Download, Search, Package } from "lucide-react";
import { fetchOrders, type Order } from "@/lib/api";
import { useState, useEffect } from "react";

export default function Routes() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const ordersData = await fetchOrders();
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) =>
    order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.city || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityColors = {
    express: "bg-destructive text-destructive-foreground",
    urgent: "bg-warning text-warning-foreground",
    standard: "bg-secondary text-secondary-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders & Routes</h1>
          <p className="text-muted-foreground">Manage delivery orders and route assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Navigation className="h-4 w-4 mr-2" />
            Optimize Routes
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredOrders.length} orders
          </span>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Time Window</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.order_id}>
                <TableCell className="font-medium">{order.order_id}</TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="font-medium">
                      {order.street} {order.house_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.postal_code} {order.city}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{order.weight} kg</TableCell>
                <TableCell>
                  <Badge className={priorityColors[order.priority]}>
                    {order.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {order.window_start} - {order.window_end}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Assign
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
