import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Moved to top imports
import { supabase } from "@/integrations/supabase/client";
import { StudentDashboard } from "@/components/StudentDashboard";
import { motion, AnimatePresence } from "framer-motion"; // New animation library
import { 
  Utensils, 
  Clock, 
  MapPin, 
  Shield, 
  Smartphone, 
  TrendingUp,
  User,
  LogOut,
  ChevronRight,
  Star,
  Zap
} from "lucide-react";
import heroImage from "@/assets/hero-campus-delivery.jpg";
import foodImage from "@/assets/food-variety.jpg";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserRole(session.user.id);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      
      if (error) throw error;
      setUserRole(data?.role || null);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    navigate("/");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  // --- LOGGED IN VIEW ---
  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md shadow-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">CFDS</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{user.email}</span>
                <Badge variant="secondary" className="capitalize shadow-none">{userRole}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto p-4 md:p-6"
        >
          {userRole === "student" && <StudentDashboard />}
          {userRole === "vendor" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Utensils className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
              <p className="text-muted-foreground max-w-md">Manage your menu items, track incoming orders, and view your earnings all in one place.</p>
              <Button>Go to Menu Management</Button>
            </div>
          )}
          {userRole === "rider" && (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
             <div className="p-4 bg-accent/10 rounded-full">
               <MapPin className="h-12 w-12 text-accent" />
             </div>
             <h1 className="text-3xl font-bold">Rider Dashboard</h1>
             <p className="text-muted-foreground max-w-md">View active delivery requests, track your routes, and manage your delivery history.</p>
             <Button variant="outline">View Active Orders</Button>
           </div>
          )}
        </motion.div>
      </div>
    );
  }

  // --- LANDING PAGE VIEW ---
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Floating Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md shadow-md py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-accent flex items-center justify-center shadow-lg">
              <Utensils className="h-6 w-6 text-white" />
            </div>
            <span className={`text-xl font-bold ${!scrolled && "text-white drop-shadow-md"}`}>CFDS</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant={scrolled ? "ghost" : "link"}
              className={!scrolled ? "text-white hover:text-white/80" : ""}
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/get-started")}
              className="shadow-lg hover:shadow-primary/25 transition-all"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-slate-900">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
          {/* Animated Blobs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-20 right-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl"
          />
        </div>
        
        <div className="container relative mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm text-white/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Operational on Babcock Campus
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Craving? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-accent">
                We Deliver.
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-gray-300 max-w-lg leading-relaxed">
              Skip the long queues at the cafeteria. Get your favorite meals from campus vendors delivered straight to your hall or faculty.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg h-14 px-8 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                Order Now <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8 rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                View Vendors
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4 text-white/60">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-gray-600 flex items-center justify-center text-xs overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="fill-current h-4 w-4" />
                  <Star className="fill-current h-4 w-4" />
                  <Star className="fill-current h-4 w-4" />
                  <Star className="fill-current h-4 w-4" />
                  <Star className="fill-current h-4 w-4" />
                </div>
                <p className="text-sm">Trusted by 2,000+ students</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero visual/phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:block relative z-10"
          >
             <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary to-accent opacity-30 blur-2xl rounded-full" />
                <div className="relative bg-card/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                  <div className="absolute -top-10 -right-10 bg-card p-4 rounded-2xl shadow-xl animate-bounce">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Delivery Time</p>
                        <p className="font-bold">15 Mins</p>
                      </div>
                    </div>
                  </div>
                  <img
                    src={foodImage}
                    alt="App Preview"
                    className="rounded-2xl shadow-inner w-full object-cover h-[500px]"
                  />
                  {/* Floating badge */}
                  <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">Jollof Rice & Chicken</p>
                      <p className="text-sm text-gray-500">Cafeteria 1 • ₦1,500</p>
                    </div>
                    <Button size="sm" className="rounded-full h-8 w-8 p-0"
                    onClick={() => navigate("/auth")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="bg-card border-y border-border/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/50">
            {[
              { label: "Active Vendors", value: "50+" },
              { label: "Daily Orders", value: "500+" },
              { label: "Avg Delivery", value: "20 min" },
              { label: "Students", value: "2.5k" },
            ].map((stat, i) => (
              <div key={i} className="px-4">
                <h3 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                  {stat.value}
                </h3>
                <p className="text-muted-foreground text-sm uppercase tracking-wider mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bento Grid Features */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20 text-primary bg-primary/5">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed for <span className="text-primary">Campus Life</span></h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to fuel your study sessions without the hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 - Large */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-2 row-span-1 bg-white dark:bg-card rounded-3xl p-8 border shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-64 h-64 text-primary" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-6">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Lightning Fast Delivery</h3>
                  <p className="text-muted-foreground max-w-md">
                    Optimized routing algorithms ensure your food arrives while it's still hot. We prioritize logic based on your hostel location.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  Learn about our tech <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-primary/10 to-transparent rounded-3xl p-8 border border-primary/10 flex flex-col justify-center items-center text-center"
            >
              <div className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mobile First</h3>
              <p className="text-muted-foreground text-sm">
                Seamless experience on all devices. Order on your way to class.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-card rounded-3xl p-8 border shadow-sm flex flex-col justify-between"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
                <p className="text-muted-foreground text-sm">
                  Integrated with top payment gateways for safe transactions.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 - Large */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-8 border shadow-sm relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 h-full">
                <div className="flex-1">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Real-time Tracking</h3>
                  <p className="text-white/70">
                    Watch your rider move on the map in real-time. Know exactly when to walk out to the hostel gate.
                  </p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-4 w-full max-w-xs backdrop-blur-sm border border-white/10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-500 animate-pulse" />
                      <div className="h-2 bg-white/20 rounded w-24" />
                    </div>
                    <div className="h-20 bg-white/10 rounded-lg w-full" />
                    <div className="h-2 bg-white/20 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Step Visualizer */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">From craving to satisfaction in 4 simple steps</p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
              {[
                { title: "Browse Menu", desc: "Select from 50+ vendors", icon: Utensils },
                { title: "Place Order", desc: "Customize & Pay securely", icon: Smartphone },
                { title: "Track Delivery", desc: "Watch the progress", icon: MapPin },
                { title: "Enjoy Meal", desc: "Meet rider & eat", icon: User }
              ].map((step, idx) => (
                <div key={idx} className="group bg-background">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-2xl bg-card border-2 border-border group-hover:border-primary group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg mb-6 relative">
                      <step.icon className="h-8 w-8 text-foreground group-hover:text-primary transition-colors" />
                      <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm border-4 border-background">
                        {idx + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-90" />
        <div 
          className="absolute inset-0 bg-cover bg-fixed opacity-20 mix-blend-multiply"
          style={{ backgroundImage: `url(${foodImage})` }}
        />
        <div className="container relative mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto bg-black/20 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Don't Study on an Empty Stomach
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of Babcock students using CFDS for their daily meals.
              Sign up today and get free delivery on your first order.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-10 py-6 bg-white text-primary hover:bg-gray-100 shadow-xl"
              >
                Create Account
              </Button>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                variant="outline"
                className="text-lg px-10 py-6 black border-white hover:bg-white/10"
              >
                Become a Vendor
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Utensils className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">CFDS</span>
            </div>
            
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p>&copy; 2025 Campus Food Delivery System. All rights reserved.</p>
              <p className="mt-1">Built with ❤️ at Babcock University</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;