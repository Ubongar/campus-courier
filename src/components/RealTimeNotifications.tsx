import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Package, Truck, CheckCircle, AlertCircle } from "lucide-react";

export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch existing notifications
      const { data: existingNotifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (existingNotifications) {
        setNotifications(existingNotifications);
        setUnreadCount(existingNotifications.filter(n => !n.read).length);
      }

      // Subscribe to new notifications
      const channel = supabase
        .channel("notifications-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as any;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            const icon = getNotificationIcon(newNotification.type);
            toast(newNotification.title, {
              description: newNotification.message,
              icon,
            });

            // Browser notification if permitted
            if (Notification.permission === "granted") {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: "/favicon.ico",
              });
            }
          }
        )
        .subscribe();

      // Request browser notification permission
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, []);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "order_placed":
      return <Package className="h-4 w-4" />;
    case "order_ready":
      return <CheckCircle className="h-4 w-4" />;
    case "rider_assigned":
      return <Truck className="h-4 w-4" />;
    case "delivery_complete":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

// Helper function to create notifications
export async function createNotification({
  userId,
  type,
  title,
  message,
  orderId,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  orderId?: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    order_id: orderId,
    read: false,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
}
