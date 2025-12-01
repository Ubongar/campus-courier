import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Store, Package, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function VendorProfile() {
  const [userEmail, setUserEmail] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: vendor } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    image_url: "",
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || "",
        description: vendor.description || "",
        location: vendor.location || "",
        image_url: vendor.image_url || "",
      });
    }
  }, [vendor]);

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!vendor) throw new Error("Vendor not found");
      
      const { error } = await supabase
        .from("vendors")
        .update(data)
        .eq("id", vendor.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
      toast({ title: "Profile updated successfully!" });
    },
  });

  const menuItems = [
    { label: "Dashboard", href: "/vendor/dashboard", icon: <Store className="h-4 w-4" /> },
    { label: "Menu", href: "/vendor/menu", icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "Orders", href: "/vendor/orders", icon: <Package className="h-4 w-4" /> },
    { label: "Profile", href: "/vendor/profile", icon: <Store className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="vendor" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vendor Profile & Branding</h1>
          <p className="text-muted-foreground">Manage your business information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your business"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Business location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Business Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <Button
              onClick={() => updateProfile.mutate(formData)}
              disabled={updateProfile.isPending}
              className="w-full"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Business Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{vendor?.rating?.toFixed(1) || "0.0"}</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{vendor?.is_active ? "Active" : "Inactive"}</p>
                <p className="text-sm text-muted-foreground">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}