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
import { Utensils, ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Retrieve state passed from GetStarted page, or default to standard values
  const defaultRole = location.state?.role || "student";
  const defaultTab = location.state?.tab || "signin";

  const [role, setRole] = useState<string>(defaultRole);
  
  // Update role if location state changes (though usually happens on mount)
  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
    }
  }, [location.state]);

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
        // Insert user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: role as any });

        if (roleError) throw roleError;

        toast.success("Account created successfully! Please check your email.");
        
        // Redirect based on role
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

      // Get user role to redirect appropriately
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
      
      toast.success("Welcome back!");
      
      // Redirect based on role
      const userRole = roleData?.role;
      console.log("User role detected:", userRole);
      
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
          console.warn("Unknown role:", userRole);
          navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 relative overflow-hidden">
      {/* Background decoration matching new design */}
      <div className="absolute inset-0 bg-slate-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl relative backdrop-blur-md bg-card/95 border-white/10">
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <CardHeader className="text-center pt-10">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Utensils className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Welcome to CFDS
          </CardTitle>
          <CardDescription className="text-base">
            Your favorite campus meals, delivered fast
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="your.email@babcock.edu.ng"
                    className="bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-background/50"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base shadow-lg hover:shadow-primary/20 transition-all" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="0801 234 5678"
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your.email@babcock.edu.ng"
                    className="bg-background/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    className="bg-background/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="rider">Rider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full h-11 text-base shadow-lg hover:shadow-primary/20 transition-all" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;