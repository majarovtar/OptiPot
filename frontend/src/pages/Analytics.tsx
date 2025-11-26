import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-chart-1/10">
              <BarChart3 className="h-5 w-5 text-chart-1" />
            </div>
            <h3 className="font-semibold">Weekly Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Routes Completed</span>
              <span className="font-medium">342</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Efficiency Rate</span>
              <span className="font-medium text-success">94.2%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <TrendingUp className="h-5 w-5 text-chart-2" />
            </div>
            <h3 className="font-semibold">Cost Savings</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">This Month</span>
              <span className="font-medium text-success">+$12,450</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">vs Last Month</span>
              <span className="font-medium">+18%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-chart-3/10">
              <Activity className="h-5 w-5 text-chart-3" />
            </div>
            <h3 className="font-semibold">Carbon Reduction</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CO₂ Saved</span>
              <span className="font-medium text-success">-842 kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trees Equivalent</span>
              <span className="font-medium">~38 trees</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Route Efficiency Trends</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Chart visualization would be implemented here with recharts
        </div>
      </Card>
    </div>
  );
}
