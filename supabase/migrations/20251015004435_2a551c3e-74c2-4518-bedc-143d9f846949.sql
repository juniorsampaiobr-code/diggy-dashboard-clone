-- Add payment settings to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS accepts_online_payment boolean DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mercado_pago_access_token text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mercado_pago_public_key text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS accepts_cash boolean DEFAULT true;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS accepts_debit boolean DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS accepts_credit boolean DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS accepts_pix boolean DEFAULT false;

-- Create business hours table
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, day_of_week)
);

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hours from their stores"
ON business_hours FOR SELECT
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = business_hours.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can insert hours to their stores"
ON business_hours FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = business_hours.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can update hours from their stores"
ON business_hours FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = business_hours.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can delete hours from their stores"
ON business_hours FOR DELETE
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = business_hours.store_id 
  AND stores.owner_id = auth.uid()
));

-- Create scheduled pauses table
CREATE TABLE IF NOT EXISTS scheduled_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pauses from their stores"
ON scheduled_pauses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = scheduled_pauses.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can insert pauses to their stores"
ON scheduled_pauses FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = scheduled_pauses.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can update pauses from their stores"
ON scheduled_pauses FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = scheduled_pauses.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can delete pauses from their stores"
ON scheduled_pauses FOR DELETE
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = scheduled_pauses.store_id 
  AND stores.owner_id = auth.uid()
));

-- Create cash register transactions table
CREATE TABLE IF NOT EXISTS cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('sale', 'withdrawal', 'deposit', 'opening', 'closing')),
  amount numeric NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'credit', 'debit', 'pix', 'mercado_pago')),
  description text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions from their stores"
ON cash_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = cash_transactions.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Users can insert transactions to their stores"
ON cash_transactions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = cash_transactions.store_id 
  AND stores.owner_id = auth.uid()
));

-- Add payment method and transaction reference to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mercado_pago_payment_id text;

-- Create triggers for updated_at
CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON business_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_pauses_updated_at
  BEFORE UPDATE ON scheduled_pauses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();