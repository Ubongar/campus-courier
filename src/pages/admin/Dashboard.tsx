import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/DashboardNav";
import { Package, Users, DollarSign, TrendingUp, ShoppingBag, Bike } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, vendors, riders, users] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact" }),
        supabase.from("vendors").select("*", { count: "exact" }),
        supabase.from("rider_profiles").select("*", { count: "exact" }),
        supabase.from("profiles").select("*", { count: "exact" }),
      ]);

      const todayOrders = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

      const todayRevenue = todayOrders.data?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      return {
        totalOrders: orders.count || 0,
        totalVendors: vendors.count || 0,
        totalRiders: riders.count || 0,
        totalUsers: users.count || 0,
        todayRevenue,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          vendors(name),
          profiles(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
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
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVendors || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRiders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats?.todayRevenue.toFixed(2) || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders?.map((order: any) => (
                <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{order.profiles?.full_name || "Customer"}</p>
                    <p className="text-sm text-muted-foreground">{order.vendors?.name || "Vendor"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{order.total_amount}</p>
                    <p className="text-sm text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}