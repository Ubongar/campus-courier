import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Package, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeliveryFlowProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeliveryFlow({ order, isOpen, onClose }: DeliveryFlowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [otpInput, setOtpInput] = useState("");

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["available-deliveries"] });
      toast({ title: "Status updated successfully!" });
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async () => {
      if (otpInput !== order.otp_code) {
        throw new Error("Invalid OTP code");
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: "delivered" as any })
        .eq("id", order.id);

      if (error) throw error;

      // Update rider stats
      const { data: riderProfile } = await supabase
        .from("rider_profiles")
        .select("total_deliveries")
        .eq("user_id", order.rider_id)
        .single();

      if (riderProfile) {
        await supabase
          .from("rider_profiles")
          .update({ total_deliveries: (riderProfile.total_deliveries || 0) + 1 })
          .eq("user_id", order.rider_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["rider-profile"] });
      toast({ title: "Delivery completed successfully!" });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getNextAction = () => {
    switch (order.status) {
      case "assigned":
        return {
          label: "Mark as Picked Up",
          action: () => updateStatusMutation.mutate("picked_up"),
        };
      case "picked_up":
        return {
          label: "Mark as In Transit",
          action: () => updateStatusMutation.mutate("in_transit"),
        };
      case "in_transit":
        return null; // Show OTP verification instead
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge>{order.status.replace("_", " ")}</Badge>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span className="font-medium">{order.vendors.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{order.profiles.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-primary">₦{order.total_amount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.delivery_location}</p>
              {order.delivery_notes && (
                <p className="text-sm text-muted-foreground mt-2">
                  Note: {order.delivery_notes}
                </p>
              )}
            </CardContent>
          </Card>

          {order.status === "in_transit" ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="otp">Enter OTP Code</Label>
                <Input
                  id="otp"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ask customer for the OTP code to complete delivery
                </p>
              </div>
              <Button
                onClick={() => completeDeliveryMutation.mutate()}
                disabled={completeDeliveryMutation.isPending || otpInput.length !== 6}
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Delivery
              </Button>
            </div>
          ) : nextAction ? (
            <Button
              onClick={nextAction.action}
              disabled={updateStatusMutation.isPending}
              className="w-full"
            >
              {nextAction.label}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
