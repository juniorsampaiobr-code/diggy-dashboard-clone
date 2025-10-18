-- Create delivery_rates table for distance-based delivery fees
CREATE TABLE public.delivery_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  max_distance_km NUMERIC NOT NULL,
  fee NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.delivery_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery_rates
CREATE POLICY "Users can view rates from their stores"
ON public.delivery_rates
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM stores
  WHERE stores.id = delivery_rates.store_id
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can insert rates to their stores"
ON public.delivery_rates
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM stores
  WHERE stores.id = delivery_rates.store_id
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can update rates from their stores"
ON public.delivery_rates
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM stores
  WHERE stores.id = delivery_rates.store_id
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can delete rates from their stores"
ON public.delivery_rates
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM stores
  WHERE stores.id = delivery_rates.store_id
  AND stores.owner_id = auth.uid()
));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_delivery_rates_updated_at
BEFORE UPDATE ON public.delivery_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add store coordinates for distance calculation
ALTER TABLE public.stores
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC;