import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScheduledOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}

export function ScheduledOrderModal({
  isOpen,
  onClose,
  vendorId,
  vendorName,
  cartItems,
  total,
}: ScheduledOrderModalProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("12:00");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  const handleScheduleOrder = async () => {
    if (!date || !deliveryLocation) {
      toast.error("Please select a date and enter delivery location");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [hours, minutes] = time.split(":").map(Number);
      const scheduledFor = new Date(date);
      scheduledFor.setHours(hours, minutes, 0, 0);

      // Create scheduled order
      const { data: order, error } = await supabase
        .from("scheduled_orders")
        .insert({
          customer_id: user.id,
          vendor_id: vendorId,
          scheduled_for: scheduledFor.toISOString(),
          delivery_location: deliveryLocation,
          delivery_notes: deliveryNotes,
          total_amount: total,
          status: "scheduled"
        })
        .select()
        .single();

      if (error) throw error;

      // Create order items
      const orderItems = cartItems.map(item => ({
        scheduled_order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from("scheduled_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("Order scheduled successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Order</DialogTitle>
          <DialogDescription>
            Schedule your order from {vendorName} for later delivery
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Select Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Delivery Location</Label>
            <Input
              placeholder="e.g., Hall A, Room 101"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Notes (Optional)</Label>
            <Textarea
              placeholder="Any special instructions..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span>Items</span>
              <span>{cartItems.length}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₦{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleScheduleOrder} disabled={isLoading} className="flex-1">
            {isLoading ? "Scheduling..." : "Schedule Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
