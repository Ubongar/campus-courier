import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bike, DollarSign, MapPin, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import DeliveryFlow from "./DeliveryFlow";
import { DashboardNav } from "@/components/DashboardNav";

export default function RiderDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: riderProfile } = useQuery({
    queryKey: ["rider-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: availableOrders } = useQuery({
    queryKey: ["available-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendors:vendor_id (name, location),
          profiles:customer_id (full_name)
        `)
        .eq("status", "ready")
        .is("rider_id", null);

      if (error) throw error;
      return data;
    },
  });

  const { data: myDeliveries } = useQuery({
    queryKey: ["my-deliveries", riderProfile?.user_id],
    queryFn: async () => {
      if (!riderProfile) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendors:vendor_id (name, location),
          profiles:customer_id (full_name)
        `)
        .eq("rider_id", riderProfile.user_id)
        .in("status", ["assigned", "picked_up", "in_transit"]);

      if (error) throw error;
      return data;
    },
    enabled: !!riderProfile,
  });

  // Real-time subscriptions
  useEffect(() => {
    const availableChannel = supabase
      .channel("available-deliveries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: "status=eq.ready",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["available-deliveries"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(availableChannel);
    };
  }, [queryClient]);

  const acceptDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!riderProfile) throw new Error("Rider profile not found");

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const { error } = await supabase
        .from("orders")
        .update({
          rider_id: riderProfile.user_id,
          status: "assigned" as any,
          otp_code: otp,
        })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["my-deliveries"] });
      toast({ title: "Delivery accepted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const menuItems = [
    { label: "Dashboard", href: "/rider/dashboard", icon: <Bike className="h-4 w-4" /> },
    { label: "Deliveries", href: "/rider/dashboard", icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="rider" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myDeliveries?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riderProfile?.total_deliveries || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riderProfile?.rating?.toFixed(1) || "N/A"}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {availableOrders?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No available deliveries</p>
              ) : (
                <div className="space-y-4">
                  {availableOrders?.map((order: any) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{order.vendors.name}</p>
                          <p className="text-sm text-muted-foreground">{order.vendors.location}</p>
                        </div>
                        <Badge>₦{order.total_amount}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{order.delivery_location}</span>
                      </div>
                      <Button onClick={() => acceptDeliveryMutation.mutate(order.id)} className="w-full">
                        Accept Delivery
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {myDeliveries?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active deliveries</p>
              ) : (
                <div className="space-y-4">
                  {myDeliveries?.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsFlowOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{order.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">{order.vendors.name}</p>
                        </div>
                        <Badge>{order.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{order.delivery_location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {selectedOrder && (
        <DeliveryFlow
          order={selectedOrder}
          isOpen={isFlowOpen}
          onClose={() => {
            setIsFlowOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}
