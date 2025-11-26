import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Filter, X, Package } from "lucide-react";
import { fetchOrders, type Order } from "@/lib/api";
import { OrderCard } from "@/components/orders/OrderCard";

type SortOption = "orderId" | "weight" | "priority" | "windowStart" | "city";
type PriorityFilter = "all" | "express" | "urgent" | "standard";
type StatusFilter = "all" | "pending" | "assigned" | "in-transit" | "delivered";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("orderId");
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>("all");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");

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

  const filteredOrders = orders
    .filter((order) => {
      if (filterPriority !== "all" && order.priority !== filterPriority) {
        return false;
      }
      if (filterStatus !== "all" && order.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "orderId":
          return a.order_id.localeCompare(b.order_id);
        case "weight":
          return b.weight - a.weight;
        case "priority": {
          const priorityOrder = { express: 0, urgent: 1, standard: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case "windowStart":
          return a.window_start.localeCompare(b.window_start);
        case "city":
          return (a.city || "").localeCompare(b.city || "");
        default:
          return 0;
      }
    });

  const hasActiveFilters = filterPriority !== "all" || filterStatus !== "all";

  const clearFilters = () => {
    setFilterPriority("all");
    setFilterStatus("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Orders Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all delivery orders
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orderId">Order ID</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="windowStart">Time Window</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as PriorityFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => (
          <OrderCard key={order.orderId} order={order} />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more results.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Orders;
