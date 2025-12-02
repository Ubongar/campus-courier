import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Store, Image, MapPin, Clock, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VendorOnboardingProps {
  userId: string;
  vendorId: string;
  onComplete: () => void;
}

const steps = [
  { id: 1, title: "Business Info", icon: Store },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Hours", icon: Clock },
  { id: 4, title: "Branding", icon: Image },
  { id: 5, title: "First Menu Item", icon: Utensils },
];

export function VendorOnboarding({ userId, vendorId, onComplete }: VendorOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [openingHours, setOpeningHours] = useState("08:00");
  const [closingHours, setClosingHours] = useState("20:00");
  const [imageUrl, setImageUrl] = useState("");
  const [menuItemName, setMenuItemName] = useState("");
  const [menuItemPrice, setMenuItemPrice] = useState("");
  const [menuItemDescription, setMenuItemDescription] = useState("");

  const progress = (currentStep / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep === 5) {
      await handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Update vendor profile
      const { error: vendorError } = await supabase
        .from("vendors")
        .update({
          name: businessName || "My Restaurant",
          description: description || "Delicious food on campus",
          location: location || "Babcock University Campus",
          image_url: imageUrl || null,
        })
        .eq("id", vendorId);

      if (vendorError) throw vendorError;

      // Create first menu item if provided
      if (menuItemName && menuItemPrice) {
        const { error: menuError } = await supabase
          .from("menu_items")
          .insert({
            vendor_id: vendorId,
            name: menuItemName,
            price: parseFloat(menuItemPrice),
            description: menuItemDescription,
            is_available: true,
          });

        if (menuError) throw menuError;
      }

      toast.success("Onboarding complete! Your store is now live.");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="e.g., Mama's Kitchen"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell customers about your food..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location on Campus</Label>
              <Input
                id="location"
                placeholder="e.g., Near Admin Building"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Be specific about your location so riders and students can find you easily.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingHours">Opening Time</Label>
                <Input
                  id="openingHours"
                  type="time"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingHours">Closing Time</Label>
                <Input
                  id="closingHours"
                  type="time"
                  value={closingHours}
                  onChange={(e) => setClosingHours(e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Set your regular operating hours. You can adjust these later.
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Store Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            {imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt="Store preview"
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              A good image helps attract customers. You can add this later.
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menuItemName">Item Name</Label>
              <Input
                id="menuItemName"
                placeholder="e.g., Jollof Rice"
                value={menuItemName}
                onChange={(e) => setMenuItemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuItemPrice">Price (₦)</Label>
              <Input
                id="menuItemPrice"
                type="number"
                placeholder="e.g., 1500"
                value={menuItemPrice}
                onChange={(e) => setMenuItemPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuItemDescription">Description (Optional)</Label>
              <Textarea
                id="menuItemDescription"
                placeholder="Describe your dish..."
                value={menuItemDescription}
                onChange={(e) => setMenuItemDescription(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Add your first menu item to get started. You can add more later.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">Step {currentStep} of {steps.length}</Badge>
          </div>
          <CardTitle>Welcome to CFDS Vendor Portal</CardTitle>
          <CardDescription>
            Let's get your store set up in a few simple steps
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step indicators */}
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isComplete = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isCurrent
                      ? "text-primary"
                      : isComplete
                      ? "text-primary/60"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isComplete
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-muted"
                    }`}
                  >
                    {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="min-h-[200px]">{renderStepContent()}</div>

          {/* Navigation */}
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading
                ? "Saving..."
                : currentStep === steps.length
                ? "Complete Setup"
                : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
