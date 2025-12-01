import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import GetStarted from "./pages/GetStarted";

// Student Pages
import Browse from "./pages/student/Browse";
import VendorMenu from "./pages/student/VendorMenu";
import Cart from "./pages/student/Cart";
import Orders from "./pages/student/Orders";
import StudentProfile from "./pages/student/Profile";

// Vendor Pages
import VendorDashboard from "./pages/vendor/Dashboard";
import MenuManagement from "./pages/vendor/MenuManagement";
import VendorOrders from "./pages/vendor/Orders";
import VendorProfile from "./pages/vendor/Profile";

// Rider Pages
import RiderDashboard from "./pages/rider/Dashboard";
import RiderTracking from "./pages/rider/Tracking";
import RiderEarnings from "./pages/rider/Earnings";
import RiderDeliveryHistory from "./pages/rider/DeliveryHistory";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminUsers from "./pages/admin/Users";
import AdminVendors from "./pages/admin/Vendors";
import AdminRiders from "./pages/admin/Riders";

// Student Pages
import StudentWallet from "./pages/student/Wallet";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => setUserRole(data?.role || null));
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (userRole && !allowedRoles.includes(userRole)) return <Navigate to="/" />;

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/get-started" element={<GetStarted/>} />
          
          {/* Student Routes */}
          <Route path="/student/browse" element={<ProtectedRoute allowedRoles={["student"]}><Browse /></ProtectedRoute>} />
          <Route path="/student/vendor/:vendorId" element={<ProtectedRoute allowedRoles={["student"]}><VendorMenu /></ProtectedRoute>} />
          <Route path="/student/cart" element={<ProtectedRoute allowedRoles={["student"]}><Cart /></ProtectedRoute>} />
          <Route path="/student/orders" element={<ProtectedRoute allowedRoles={["student"]}><Orders /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />
          
          {/* Vendor Routes */}
          <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={["vendor"]}><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/menu" element={<ProtectedRoute allowedRoles={["vendor"]}><MenuManagement /></ProtectedRoute>} />
          <Route path="/vendor/orders" element={<ProtectedRoute allowedRoles={["vendor"]}><VendorOrders /></ProtectedRoute>} />
          <Route path="/vendor/profile" element={<ProtectedRoute allowedRoles={["vendor"]}><VendorProfile /></ProtectedRoute>} />
          
          {/* Rider Routes */}
          <Route path="/rider/dashboard" element={<ProtectedRoute allowedRoles={["rider"]}><RiderDashboard /></ProtectedRoute>} />
          <Route path="/rider/tracking" element={<ProtectedRoute allowedRoles={["rider"]}><RiderTracking /></ProtectedRoute>} />
          <Route path="/rider/earnings" element={<ProtectedRoute allowedRoles={["rider"]}><RiderEarnings /></ProtectedRoute>} />
          <Route path="/rider/history" element={<ProtectedRoute allowedRoles={["rider"]}><RiderDeliveryHistory /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/vendors" element={<ProtectedRoute allowedRoles={["admin"]}><AdminVendors /></ProtectedRoute>} />
          <Route path="/admin/riders" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRiders /></ProtectedRoute>} />

          {/* Student Wallet */}
          <Route path="/student/wallet" element={<ProtectedRoute allowedRoles={["student"]}><StudentWallet /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;