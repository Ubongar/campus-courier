import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/DashboardNav";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Users, ShoppingBag, Bike } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminRiders() {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: riders } = useQuery({
    queryKey: ["admin-riders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rider_profiles")
        .select("*, profiles(full_name), orders!orders_rider_id_fkey(delivery_fee)")
        .order("created_at", { ascending: false });
      return data;
    },
  });

  const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Orders", href: "/admin/orders", icon: <Package className="h-4 w-4" /> },
    { label: "Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
    { label: "Vendors", href: "/admin/vendors", icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "Riders", href: "/admin/riders", icon: <Bike className="h-4 w-4" /> },
    { label: "Analytics", href: "/admin/analytics", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="admin" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Rider Management</h1>
          <p className="text-muted-foreground">Manage delivery riders and performance</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Riders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riders?.map((rider: any) => {
                const totalEarnings = rider.orders?.reduce((sum: number, o: any) => sum + Number(o.delivery_fee), 0) || 0;
                return (
                  <div key={rider.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{rider.profiles?.full_name || "Rider"}</p>
                        <p className="text-sm text-muted-foreground">{rider.vehicle_type || "N/A"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rider.total_deliveries || 0} deliveries • {rider.rating?.toFixed(1) || "5.0"} ★
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₦{totalEarnings.toFixed(2)}</p>
                        <Badge className="mt-1">{rider.is_available ? "Available" : "Busy"}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}