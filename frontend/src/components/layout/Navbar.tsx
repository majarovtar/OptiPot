import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Navigation, Truck, BarChart3, Menu, User, ChevronDown, Check, Package } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRole } from "@/contexts/RoleContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/routes", icon: Navigation, label: "Routes" },
  { to: "/fleet", icon: Truck, label: "Fleet" },
  { to: "/orders", icon: Package, label: "Orders" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { role, setRole } = useRole();

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
          onClick={() => setOpen(false)}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <img 
              src="/image.jpg" 
              alt="OptiPot Logo" 
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="font-bold text-lg text-foreground">OptiPot</span>
          </div>
          
          {role === "manager" && (
            <nav className="hidden md:flex items-center gap-2">
              <NavLinks />
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                <span>Account</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuItem
                onClick={() => setRole("manager")}
                className="cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span>Manager View</span>
                {role === "manager" && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRole("driver")}
                className="cursor-pointer"
              >
                <Truck className="h-4 w-4 mr-2" />
                <span>Driver View</span>
                {role === "driver" && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {role === "manager" && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-2 mt-8">
                  <NavLinks />
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};
