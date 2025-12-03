import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Bike, DollarSign, MapPin, Package, CheckCircle, Star, TrendingUp, Sparkles, Navigation, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import DeliveryFlow from "./DeliveryFlow";
import { DashboardNav } from "@/components/DashboardNav";
import { motion } from "framer-motion";

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
      setUserName(data.user?.user_metadata?.full_name?.split(" ")[0] || "Rider");
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

  const { data: allDeliveries } = useQuery({
    queryKey: ["all-deliveries", riderProfile?.user_id],
    queryFn: async () => {
      if (!riderProfile) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("rider_id", riderProfile.user_id);

      if (error) throw error;
      return data;
    },
    enabled: !!riderProfile,
  });

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

  const acceptDelivery = useMutation({
    mutationFn: async (orderId: string) => {
      if (!riderProfile) throw new Error("Rider profile not found");

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
      toast({ title: "Delivery accepted! Let's go! 🚀" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeDeliveries = myDeliveries || [];

  const todaysEarnings = allDeliveries?.filter((d: any) => 
    new Date(d.created_at).toDateString() === new Date().toDateString()
  ).reduce((sum: number, d: any) => sum + Number(d.delivery_fee || 100), 0) || 0;

  const todaysDeliveries = allDeliveries?.filter((d: any) => 
    new Date(d.created_at).toDateString() === new Date().toDateString()
  ).length || 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const menuItems = [
    { label: "Dashboard", href: "/rider/dashboard", icon: <Bike className="h-4 w-4" /> },
    { label: "Deliveries", href: "/rider/dashboard", icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <DashboardNav userEmail={userEmail} userRole="rider" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8">
        {/* Warm Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Bike className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {getGreeting()}, {userName}! 🚴
              </h1>
              <p className="text-muted-foreground">Ready to hit the road and earn?</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDeliveries.length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Today</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysDeliveries}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-br from-accent/10 to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Earnings</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-accent/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₦{todaysEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" /> Today
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Rating</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riderProfile?.rating?.toFixed(1) || "5.0"}</div>
              <p className="text-xs text-muted-foreground">⭐ Excellent</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Deliveries */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-none shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  My Active Deliveries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeDeliveries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Bike className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-muted-foreground">No active deliveries</p>
                    <p className="text-sm text-muted-foreground mt-1">Check available orders to start earning! 💰</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeDeliveries.map((order: any) => (
                      <div
                        key={order.id}
                        className="p-4 border border-border/50 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsFlowOpen(true);
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                              <span className="text-lg">📦</span>
                            </div>
                            <div>
                              <p className="font-semibold">{order.profiles?.full_name || "Customer"}</p>
                              <p className="text-sm text-muted-foreground">{order.vendors?.name || "Vendor"}</p>
                            </div>
                          </div>
                          <Badge className="rounded-xl">{order.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{order.delivery_location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Available Orders */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-none shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Available Deliveries
                  {availableOrders && availableOrders.length > 0 && (
                    <Badge variant="secondary" className="ml-2 rounded-full">
                      {availableOrders.length} new
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableOrders?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-10 w-10 text-accent" />
                    </div>
                    <p className="text-muted-foreground">No orders available</p>
                    <p className="text-sm text-muted-foreground mt-1">Check back soon! ☕</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableOrders?.map((order: any) => (
                      <div key={order.id} className="p-4 border border-border/50 rounded-2xl hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center">
                              <span className="text-lg">🍔</span>
                            </div>
                            <div>
                              <p className="font-semibold">{order.vendors?.name || "Vendor"}</p>
                              <p className="text-sm text-muted-foreground">{order.vendors?.location || "Campus"}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-xl border-green-500/30 text-green-600 bg-green-500/10">
                            ₦{order.total_amount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{order.delivery_location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-600">
                            +₦{order.delivery_fee || 100} earnings
                          </p>
                          <Button
                            onClick={() => acceptDelivery.mutate(order.id)}
                            disabled={acceptDelivery.isPending}
                            className="rounded-xl"
                            size="sm"
                          >
                            Accept & Go
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
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