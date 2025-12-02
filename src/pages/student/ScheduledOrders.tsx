import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardNav } from "@/components/DashboardNav";
import { Calendar, Clock, MapPin, Trash2, ShoppingBag, Home, Package, User, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ScheduledOrders() {
  const [userEmail, setUserEmail] = useState<string>("");
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: scheduledOrders, isLoading } = useQuery({
    queryKey: ["scheduled-orders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("scheduled_orders")
        .select(`
          *,
          scheduled_order_items (*)
        `)
        .eq("customer_id", user.id)
        .order("scheduled_for", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("scheduled_orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-orders"] });
      toast.success("Scheduled order cancelled");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-500";
      case "processing":
        return "bg-yellow-500/10 text-yellow-500";
      case "completed":
        return "bg-green-500/10 text-green-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const menuItems = [
    { label: "Browse", href: "/student/browse", icon: <Home className="h-4 w-4" /> },
    { label: "Orders", href: "/student/orders", icon: <Package className="h-4 w-4" /> },
    { label: "Scheduled", href: "/student/scheduled", icon: <Calendar className="h-4 w-4" /> },
    { label: "Wallet", href: "/student/wallet", icon: <Wallet className="h-4 w-4" /> },
    { label: "Profile", href: "/student/profile", icon: <User className="h-4 w-4" /> },
  ];

  const upcomingOrders = scheduledOrders?.filter(
    (o: any) => new Date(o.scheduled_for) > new Date() && o.status === "scheduled"
  ) || [];

  const pastOrders = scheduledOrders?.filter(
    (o: any) => new Date(o.scheduled_for) <= new Date() || o.status !== "scheduled"
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="student" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Scheduled Orders</h1>
          <p className="text-muted-foreground">Manage your pre-scheduled meal orders</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : scheduledOrders?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Scheduled Orders</h3>
              <p className="text-muted-foreground mb-4">
                You haven't scheduled any orders yet. Browse vendors to schedule a meal for later.
              </p>
              <Button onClick={() => window.location.href = "/student/browse"}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse Vendors
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Orders */}
            {upcomingOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Upcoming Orders</h2>
                <div className="space-y-4">
                  {upcomingOrders.map((order: any) => (
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Order #{order.id.slice(0, 8)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(order.scheduled_for), "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(order.scheduled_for), "h:mm a")}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm mt-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {order.delivery_location}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-bold">₦{Number(order.total_amount).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.scheduled_order_items?.length || 0} items
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => cancelOrder.mutate(order.id)}
                              disabled={cancelOrder.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Past Scheduled Orders</h2>
                <div className="space-y-4">
                  {pastOrders.map((order: any) => (
                    <Card key={order.id} className="opacity-70">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Order #{order.id.slice(0, 8)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(order.scheduled_for), "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(order.scheduled_for), "h:mm a")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">₦{Number(order.total_amount).toFixed(2)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
