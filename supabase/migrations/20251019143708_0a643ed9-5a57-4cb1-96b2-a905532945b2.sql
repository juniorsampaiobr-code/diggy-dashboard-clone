-- Production optimizations: indexes, constraints, and triggers

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);

CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_store_id ON public.cash_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_created_at ON public.cash_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON public.cash_transactions(type);

CREATE INDEX IF NOT EXISTS idx_business_hours_store_id ON public.business_hours(store_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_day_of_week ON public.business_hours(day_of_week);

CREATE INDEX IF NOT EXISTS idx_delivery_rates_store_id ON public.delivery_rates(store_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_pauses_store_id ON public.scheduled_pauses(store_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_pauses_dates ON public.scheduled_pauses(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);

-- Drop existing triggers before recreating
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_delivery_rates_updated_at ON public.delivery_rates;
DROP TRIGGER IF EXISTS update_business_hours_updated_at ON public.business_hours;
DROP TRIGGER IF EXISTS update_scheduled_pauses_updated_at ON public.scheduled_pauses;
DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Create triggers for updated_at columns
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_rates_updated_at
  BEFORE UPDATE ON public.delivery_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_pauses_updated_at
  BEFORE UPDATE ON public.scheduled_pauses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add check constraints for data validation (using DO block to handle existing constraints)
DO $$ 
BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_price_positive CHECK (price >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_unit_price_positive CHECK (unit_price >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_subtotal_positive CHECK (subtotal >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_total_amount_positive CHECK (total_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.cash_transactions ADD CONSTRAINT cash_transactions_amount_positive CHECK (amount > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.delivery_rates ADD CONSTRAINT delivery_rates_distance_positive CHECK (max_distance_km > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.delivery_rates ADD CONSTRAINT delivery_rates_fee_nonnegative CHECK (fee >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.business_hours ADD CONSTRAINT business_hours_valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.business_hours ADD CONSTRAINT business_hours_valid_times CHECK (open_time < close_time);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add table comments for documentation
COMMENT ON TABLE public.stores IS 'Store information and configuration';
COMMENT ON TABLE public.products IS 'Products available in stores';
COMMENT ON TABLE public.categories IS 'Product categories';
COMMENT ON TABLE public.orders IS 'Customer orders';
COMMENT ON TABLE public.order_items IS 'Items within orders';
COMMENT ON TABLE public.cash_transactions IS 'Cash register transactions';
COMMENT ON TABLE public.business_hours IS 'Store operating hours by day of week';
COMMENT ON TABLE public.delivery_rates IS 'Delivery fee rates by distance';
COMMENT ON TABLE public.scheduled_pauses IS 'Scheduled store closures';
COMMENT ON TABLE public.profiles IS 'User profile information';