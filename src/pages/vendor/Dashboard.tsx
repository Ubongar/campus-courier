import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, DollarSign, Clock, Settings, Utensils, User, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { VendorOnboarding } from "@/components/VendorOnboarding";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
      setUserId(data.user?.id || "");
    });
  }, []);

  const { data: vendor, refetch: refetchVendor } = useQuery({
    queryKey: ["my-vendor"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Check if vendor needs onboarding (name is default or empty)
  useEffect(() => {
    if (vendor && (!vendor.name || vendor.name === "New vendor on campus" || vendor.description === "New vendor on campus")) {
      setShowOnboarding(true);
    }
  }, [vendor]);

  const { data: orders } = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (quantity, unit_price),
          profiles:customer_id (full_name)
        `)
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendor,
  });

  const pendingOrders = orders?.filter((o) => ["pending", "confirmed"].includes(o.status)) || [];
  const todayRevenue = orders
    ?.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

  const menuItems = [
    { label: "Dashboard", href: "/vendor/dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Menu", href: "/vendor/menu", icon: <Utensils className="h-4 w-4" /> },
    { label: "Orders", href: "/vendor/orders", icon: <Package className="h-4 w-4" /> },
    { label: "Profile", href: "/vendor/profile", icon: <User className="h-4 w-4" /> },
  ];

  // Show onboarding if needed
  if (showOnboarding && vendor) {
    return (
      <VendorOnboarding
        userId={userId}
        vendorId={vendor.id}
        onComplete={() => {
          setShowOnboarding(false);
          refetchVendor();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="vendor" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{todayRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending orders</p>
            ) : (
              <div className="space-y-4">
                {pendingOrders.slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{order.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items.length} items • ₦{order.total_amount}
                      </p>
                    </div>
                    <Badge>{order.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
