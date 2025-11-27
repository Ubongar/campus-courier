import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardNav } from "@/components/DashboardNav";
import { DollarSign, TrendingUp, Calendar, Wallet, ArrowDownLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Earnings() {
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");

  // Mock withdrawal function
  const handleWithdraw = () => {
    toast({
      title: "Withdrawal Initiated",
      description: "Funds will arrive in your bank account within 24 hours.",
    });
  };

  const { data: earningsData, isLoading } = useQuery({
    queryKey: ["rider-earnings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setUserEmail(user.email || "");

      // Get completed orders
      const { data: orders } = await supabase
        .from("orders")
        .select("created_at, delivery_fee, total_amount, status")
        .eq("rider_id", user.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      return orders || [];
    },
  });

  const totalEarnings = earningsData?.reduce((sum, order) => sum + (order.delivery_fee || 0), 0) || 0;
  const thisWeekEarnings = earningsData?.filter(o => {
    const orderDate = new Date(o.created_at);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return orderDate > oneWeekAgo;
  }).reduce((sum, order) => sum + (order.delivery_fee || 0), 0) || 0;

  const menuItems = [
    { label: "Dashboard", href: "/rider/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Earnings", href: "/rider/earnings", icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userEmail={userEmail} userRole="rider" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Earnings & Wallet</h1>

        {/* Balance Card */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 opacity-90 mb-4">
                <Wallet className="h-5 w-5" />
                <span className="font-medium">Available Balance</span>
              </div>
              <div className="text-4xl font-bold mb-6">₦{totalEarnings.toLocaleString()}</div>
              <Button 
                variant="secondary" 
                className="w-full font-semibold"
                onClick={handleWithdraw}
              >
                Request Payout
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-muted-foreground">This Week</span>
                <span className="text-xl font-bold">₦{thisWeekEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-muted-foreground">Total Deliveries</span>
                <span className="text-xl font-bold">{earningsData?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg. per Delivery</span>
                <span className="text-xl font-bold">
                  ₦{earningsData?.length ? (totalEarnings / earningsData.length).toFixed(0) : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <h2 className="text-xl font-semibold mb-4">Recent History</h2>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading history...</div>
            ) : earningsData?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No earnings yet. Start delivering!</div>
            ) : (
              <div className="divide-y">
                {earningsData?.map((order, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <ArrowDownLeft className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Delivery Fee</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                          <span>•</span>
                          {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600">+₦{order.delivery_fee}</span>
                      <div>
                        <Badge variant="outline" className="text-[10px] uppercase">Completed</Badge>
                      </div>
                    </div>
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