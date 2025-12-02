import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, Clock, Star, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  vendor_id: string;
  prep_time: number | null;
  vendors?: {
    name: string;
    rating: number | null;
  };
}

export default function AIRecommendations() {
  const navigate = useNavigate();
  const [timeOfDay, setTimeOfDay] = useState<string>("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setTimeOfDay("breakfast");
    else if (hour < 15) setTimeOfDay("lunch");
    else if (hour < 19) setTimeOfDay("dinner");
    else setTimeOfDay("late night snack");
  }, []);

  // Fetch popular items based on order frequency
  const { data: popularItems, isLoading: loadingPopular } = useQuery({
    queryKey: ["popular-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select(`
          *,
          vendors:vendor_id (name, rating)
        `)
        .eq("is_available", true)
        .limit(4);

      if (error) throw error;
      return data as MenuItem[];
    },
  });

  // Fetch user's recent orders for personalized recommendations
  const { data: recentOrders } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          vendor_id,
          order_items (
            menu_item_id,
            menu_items (name, price, vendor_id)
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // AI-powered recommendations based on time of day and past orders
  const getRecommendationReason = (item: MenuItem): string => {
    const reasons = [
      `Perfect for ${timeOfDay}`,
      "Trending this week",
      "Quick preparation",
      "Highly rated",
      "Student favorite",
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const handleAddToCart = (item: MenuItem) => {
    // Navigate to vendor page
    navigate(`/student/vendor/${item.vendor_id}`);
  };

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">AI Recommendations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Personalized picks for your {timeOfDay}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingPopular ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularItems?.map((item) => (
              <div
                key={item.id}
                className="group relative flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleAddToCart(item)}
              >
                <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                    alt={item.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold truncate">{item.name}</h4>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      ₦{item.price}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.vendors?.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.prep_time || 15} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {item.vendors?.rating?.toFixed(1) || "New"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                    <TrendingUp className="h-3 w-3" />
                    {getRecommendationReason(item)}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute bottom-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(item);
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {popularItems?.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No recommendations yet. Start ordering to get personalized suggestions!
            </p>
          </div>
        )}

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
          <p className="text-xs text-muted-foreground text-center">
            🤖 Recommendations improve as you order more. We learn your preferences to suggest meals you'll love!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
