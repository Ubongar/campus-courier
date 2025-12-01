import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/DashboardNav";
import { Package, TrendingUp, Users, ShoppingBag, Bike, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminAnalytics() {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: analytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [orders, vendors] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("vendors").select("*, orders(total_amount, created_at)"),
      ]);

      const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const completedOrders = orders.data?.filter(o => o.status === "delivered").length || 0;
      const avgOrderValue = totalRevenue / (orders.data?.length || 1);

      // Top vendors by revenue
      const vendorRevenue = vendors.data?.map(v => ({
        name: v.name,
        revenue: v.orders?.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0) || 0,
        orderCount: v.orders?.length || 0,
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      return {
        totalRevenue,
        completedOrders,
        avgOrderValue,
        vendorRevenue,
      };
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
          <h1 className="text-3xl font-bold mb-2">Analytics & Reporting</h1>
          <p className="text-muted-foreground">Platform performance insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{analytics?.totalRevenue.toFixed(2) || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.completedOrders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{analytics?.avgOrderValue.toFixed(2) || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.vendorRevenue?.map((vendor: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{vendor.name}</p>
                    <p className="text-sm text-muted-foreground">{vendor.orderCount} orders</p>
                  </div>
                  <p className="font-bold text-lg">₦{vendor.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}