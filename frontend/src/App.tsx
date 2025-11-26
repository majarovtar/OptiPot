import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import Dashboard from "./pages/Dashboard";
import RoutePlanner from "./pages/RoutePlanner";
import Fleet from "./pages/Fleet";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import DriverView from "./pages/DriverView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { role } = useRole();

  if (role === "driver") {
    return (
      <Routes>
        <Route path="/" element={<DriverView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/routes" element={<RoutePlanner />} />
      <Route path="/fleet" element={<Fleet />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-6 px-4">
              <AppRoutes />
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;
