import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/DashboardNav";
import GPSMap from "@/components/GPSMap";
import { Bike, Package, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

export default function RiderTracking() {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: activeDelivery } = useQuery({
    queryKey: ["active-delivery"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          vendors(name, location)
        `)
        .eq("rider_id", user.id)
        .in("status", ["assigned", "picked_up", "in_transit"])
        .limit(1)
        .maybeSingle();

      if (!data) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.customer_id)
        .single();

      return { ...data, customer_name: profile?.full_name };
    },
  });

  const menuItems = [
    { label: "Dashboard", href: "/rider/dashboard", icon: <Bike className="h-4 w-4" /> },
    { label: "Tracking", href: "/rider/tracking", icon: <MapPin className="h-4 w-4" /> },
    { label: "Earnings", href: "/rider/earnings", icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="rider" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Live Tracking</h1>
          <p className="text-muted-foreground">Real-time delivery monitoring</p>
        </div>

        {activeDelivery ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <GPSMap
                    pickup={{ lat: 0, lng: 0, label: activeDelivery.vendors?.location }}
                    dropoff={{ lat: 0, lng: 0, label: activeDelivery.delivery_location }}
                    currentLocation={{ lat: 0, lng: 0, label: "Your Location" }}
                    showRoute
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{(activeDelivery as any).customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-semibold">{activeDelivery.vendors?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Location</p>
                  <p className="font-semibold">{activeDelivery.delivery_location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Amount</p>
                  <p className="font-semibold">₦{activeDelivery.total_amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Fee</p>
                  <p className="font-semibold">₦{activeDelivery.delivery_fee || 100}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active delivery</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}