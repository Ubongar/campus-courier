import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, TrendingUp, Users, ShoppingBag, Bike } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminOrders() {
  const [userEmail, setUserEmail] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: orders } = useQuery({
    queryKey: ["admin-all-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          vendors(name),
          profiles(full_name),
          rider_profiles!orders_rider_id_fkey(user_id)
        `)
        .order("created_at", { ascending: false });
      return data;
    },
  });

  const { data: availableRiders } = useQuery({
    queryKey: ["available-riders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rider_profiles")
        .select("*, profiles(full_name)")
        .eq("is_available", true);
      return data;
    },
  });

  const assignRider = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const { error } = await supabase
        .from("orders")
        .update({ rider_id: riderId, status: "assigned", otp_code: otp })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-orders"] });
      toast({ title: "Rider assigned successfully" });
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
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-muted-foreground">Manage and assign orders to riders</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders?.map((order: any) => (
                <div key={order.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{order.profiles?.full_name || "Customer"}</p>
                      <p className="text-sm text-muted-foreground">{order.vendors?.name || "Vendor"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{order.delivery_location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₦{order.total_amount}</p>
                      <Badge className="mt-1">{order.status}</Badge>
                    </div>
                  </div>

                  {order.status === "ready" && !order.rider_id && (
                    <div className="flex gap-2 items-center">
                      <Select onValueChange={(riderId) => assignRider.mutate({ orderId: order.id, riderId })}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Assign Rider" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRiders?.map((rider: any) => (
                            <SelectItem key={rider.user_id} value={rider.user_id}>
                              {rider.profiles?.full_name || "Rider"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}