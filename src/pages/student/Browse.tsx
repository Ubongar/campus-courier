import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { DashboardNav } from "@/components/DashboardNav";
import { Star, Search, MapPin, Store, Clock, Utensils, ShoppingCart, Package, UserCircle, Heart, Filter, Wallet, Sparkles, Coffee, Pizza, Soup } from "lucide-react";
import SupportChat from "@/components/SupportChat";
import AIRecommendations from "@/components/AIRecommendations";
import { motion } from "framer-motion";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  const categories = [
    { name: "All", icon: <Utensils className="h-4 w-4" /> },
    { name: "Fast Food", icon: <Pizza className="h-4 w-4" /> },
    { name: "Traditional", icon: <Soup className="h-4 w-4" /> },
    { name: "Drinks", icon: <Coffee className="h-4 w-4" /> },
    { name: "Snacks", icon: <Sparkles className="h-4 w-4" /> },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
      setUserName(data.user?.user_metadata?.full_name?.split(" ")[0] || "Scholar");
    });
  }, []);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || true;
    return matchesSearch && matchesCategory;
  });

  const menuItems = [
    { label: "Browse", href: "/student/browse", icon: <Store className="h-4 w-4" /> },
    { label: "Cart", href: "/student/cart", icon: <ShoppingCart className="h-4 w-4" /> },
    { label: "Orders", href: "/student/orders", icon: <Package className="h-4 w-4" /> },
    { label: "Scheduled", href: "/student/scheduled", icon: <Clock className="h-4 w-4" /> },
    { label: "Wallet", href: "/student/wallet", icon: <Wallet className="h-4 w-4" /> },
    { label: "Profile", href: "/student/profile", icon: <UserCircle className="h-4 w-4" /> },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <DashboardNav userEmail={userEmail} userRole="student" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Warm Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-muted-foreground">What delicious meal are you craving today?</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for restaurants, cuisines, or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-card shadow-sm rounded-2xl border-border/50 focus:border-primary/50 text-base"
            />
          </div>
          <Button variant="outline" className="h-14 px-6 gap-2 rounded-2xl hidden md:flex border-border/50">
            <Filter className="h-5 w-5" /> Filters
          </Button>
        </motion.div>

        {/* Categories Pills */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.name)}
              className={`rounded-2xl px-5 h-11 gap-2 shrink-0 transition-all ${
                selectedCategory === category.name 
                  ? "shadow-lg" 
                  : "bg-card border-border/50 hover:border-primary/30"
              }`}
            >
              {category.icon}
              {category.name}
            </Button>
          ))}
        </motion.div>

        {/* AI Recommendations Section */}
        <AIRecommendations />

        {/* Vendors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-none shadow-sm rounded-3xl overflow-hidden">
                <div className="h-48 bg-muted" />
                <CardContent className="p-5 space-y-3">
                  <div className="h-6 bg-muted rounded-lg w-3/4" />
                  <div className="h-4 bg-muted rounded-lg w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVendors?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 h-24 w-24 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
            <p className="text-muted-foreground">Try changing your filters or search term</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredVendors?.map((vendor) => (
              <motion.div key={vendor.id} variants={itemVariants}>
                <Card
                  className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden rounded-3xl bg-card"
                  onClick={() => navigate(`/student/vendor/${vendor.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={vendor.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                      alt={vendor.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-10 w-10 rounded-2xl bg-white/90 hover:bg-white text-rose-500 shadow-lg" 
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-white">
                      <div>
                        <h3 className="font-bold text-lg drop-shadow-md">{vendor.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-white/90">
                          <Clock className="h-3 w-3" /> 15-25 min • <span className="font-medium text-green-300">Free Delivery</span>
                        </div>
                      </div>
                      <Badge className="bg-white/95 text-foreground hover:bg-white border-none flex items-center gap-1 rounded-xl shadow-lg">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {vendor.rating?.toFixed(1) || "New"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {vendor.description || "Delicious meals prepared with love, ready for delivery to your doorstep."}
                    </p>
                    <Separator className="mb-3" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <span>{vendor.location}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
      
      <SupportChat />
    </div>
  );
}