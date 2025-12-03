import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Utensils, ArrowLeft, Sparkles, Heart, Users, Bike } from "lucide-react";
import { motion } from "framer-motion";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  const defaultRole = location.state?.role || "student";
  const defaultTab = location.state?.tab || "signin";

  const [role, setRole] = useState<string>(defaultRole);
  
  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
    }
  }, [location.state]);

  const getRoleIcon = (r: string) => {
    switch(r) {
      case "student": return <Users className="h-4 w-4" />;
      case "vendor": return <Utensils className="h-4 w-4" />;
      case "rider": return <Bike className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleMessage = (r: string) => {
    switch(r) {
      case "student": return "Ready to satisfy your cravings? 🍕";
      case "vendor": return "Let's grow your business together! 📈";
      case "rider": return "Start earning on your own schedule! 🚴";
      default: return "Welcome to the family!";
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: role as any });

        if (roleError) throw roleError;

        toast.success("Welcome to CFDS! 🎉 Check your email to get started.");
        
        switch (role) {
          case "student":
            navigate("/student/browse", { replace: true });
            break;
          case "vendor":
            navigate("/vendor/dashboard", { replace: true });
            break;
          case "rider":
            navigate("/rider/dashboard", { replace: true });
            break;
          case "admin":
            navigate("/admin/dashboard", { replace: true });
            break;
          default:
            navigate("/", { replace: true });
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();
      
      if (roleError) {
        console.error("Error fetching role:", roleError);
        toast.error("Could not determine user role. Please contact support.");
        setIsLoading(false);
        return;
      }
      
      toast.success("Welcome back! We missed you 💖");
      
      const userRole = roleData?.role;
      
      switch (userRole) {
        case "student":
          navigate("/student/browse", { replace: true });
          break;
        case "vendor":
          navigate("/vendor/dashboard", { replace: true });
          break;
        case "rider":
          navigate("/rider/dashboard", { replace: true });
          break;
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-accent/15 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="shadow-2xl backdrop-blur-md bg-card/95 border-border/50 rounded-3xl overflow-hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute left-4 top-4 text-muted-foreground hover:text-foreground z-10"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <CardHeader className="text-center pt-12 pb-6">
            <motion.div 
              className="flex justify-center mb-4"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
                <Utensils className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold text-gradient">
              Campus Food Delivery
            </CardTitle>
            <CardDescription className="text-base flex items-center justify-center gap-2">
              <Heart className="h-4 w-4 text-primary fill-primary" />
              Made with love for Babcock
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 rounded-2xl">
                <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Welcome Back
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Join Us
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your.email@babcock.edu.ng"
                      className="h-12 rounded-xl bg-muted/30 border-border/50 focus:border-primary/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-12 rounded-xl bg-muted/30 border-border/50 focus:border-primary/50"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base rounded-xl shadow-lg hover:shadow-primary/25 transition-all font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Role Selection with Friendly Message */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-4">
                    <p className="text-sm text-center font-medium text-foreground/80">
                      {getRoleMessage(role)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="John Doe"
                        className="h-11 rounded-xl bg-muted/30 border-border/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="0801 234 5678"
                        className="h-11 rounded-xl bg-muted/30 border-border/50"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your.email@babcock.edu.ng"
                      className="h-11 rounded-xl bg-muted/30 border-border/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Create Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      minLength={6}
                      className="h-11 rounded-xl bg-muted/30 border-border/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">I want to...</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="student" className="rounded-lg">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Order delicious food
                          </span>
                        </SelectItem>
                        <SelectItem value="vendor" className="rounded-lg">
                          <span className="flex items-center gap-2">
                            <Utensils className="h-4 w-4" /> Sell my food
                          </span>
                        </SelectItem>
                        <SelectItem value="rider" className="rounded-lg">
                          <span className="flex items-center gap-2">
                            <Bike className="h-4 w-4" /> Deliver & earn money
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base rounded-xl shadow-lg hover:shadow-primary/25 transition-all font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Creating your account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {getRoleIcon(role)} Create Account
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to our friendly terms of service 🤝
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;