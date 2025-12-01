import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function StudentWallet() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: wallet } = useQuery({
    queryKey: ["student-wallet"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // Create wallet if doesn't exist
        const { data: newWallet } = await supabase
          .from("wallets")
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();
        return newWallet;
      }

      if (error) throw error;
      return data;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["student-transactions", wallet?.id],
    queryFn: async () => {
      if (!wallet) return [];
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!wallet,
  });

  const addFunds = useMutation({
    mutationFn: async (amountToAdd: number) => {
      if (!wallet) throw new Error("Wallet not found");
      
      // Mock payment - in production, integrate with Paystack
      const { error: transError } = await supabase.from("transactions").insert({
        wallet_id: wallet.id,
        type: "credit",
        amount: amountToAdd,
        status: "completed",
        description: "Wallet top-up (Mock Payment)",
      });

      if (transError) throw transError;

      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: wallet.balance + amountToAdd })
        .eq("id", wallet.id);

      if (walletError) throw walletError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["student-transactions"] });
      toast({ title: "Funds added successfully!" });
      setAmount("");
    },
  });

  const menuItems = [
    { label: "Browse", href: "/student/browse" },
    { label: "Orders", href: "/student/orders" },
    { label: "Wallet", href: "/student/wallet" },
    { label: "Profile", href: "/student/profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="student" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and transactions</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-6">₦{wallet?.balance.toFixed(2) || "0.00"}</div>
            
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="max-w-[200px]"
              />
              <Button
                onClick={() => amount && addFunds.mutate(parseFloat(amount))}
                disabled={!amount || addFunds.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Funds (Mock)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Payment integration will be completed soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions?.map((trans: any) => (
                <div key={trans.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {trans.type === "credit" ? (
                      <ArrowDownRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{trans.description || trans.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trans.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${trans.type === "credit" ? "text-green-500" : "text-red-500"}`}>
                      {trans.type === "credit" ? "+" : "-"}₦{trans.amount.toFixed(2)}
                    </p>
                    <Badge variant="outline" className="text-xs">{trans.status}</Badge>
                  </div>
                </div>
              ))}
              {!transactions?.length && (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}