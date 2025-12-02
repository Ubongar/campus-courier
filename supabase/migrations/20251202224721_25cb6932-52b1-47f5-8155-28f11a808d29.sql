-- Add unique constraint on user_id for vendors table to fix ON CONFLICT
ALTER TABLE public.vendors ADD CONSTRAINT vendors_user_id_key UNIQUE (user_id);

-- Create scheduled_orders table for scheduled ordering feature
CREATE TABLE public.scheduled_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_location TEXT NOT NULL,
  delivery_notes TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled_order_items table
CREATE TABLE public.scheduled_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_order_id UUID NOT NULL REFERENCES public.scheduled_orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_orders
CREATE POLICY "Users can view own scheduled orders" ON public.scheduled_orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can create scheduled orders" ON public.scheduled_orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own scheduled orders" ON public.scheduled_orders
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete own scheduled orders" ON public.scheduled_orders
  FOR DELETE USING (auth.uid() = customer_id);

-- RLS Policies for scheduled_order_items
CREATE POLICY "Users can view scheduled order items" ON public.scheduled_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.scheduled_orders 
    WHERE id = scheduled_order_items.scheduled_order_id 
    AND customer_id = auth.uid()
  ));

CREATE POLICY "Users can create scheduled order items" ON public.scheduled_order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.scheduled_orders 
    WHERE id = scheduled_order_items.scheduled_order_id 
    AND customer_id = auth.uid()
  ));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;