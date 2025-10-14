-- Remove the overly permissive policy that allows anyone to view all orders
DROP POLICY IF EXISTS "Customers can view their orders by phone" ON public.orders;

-- Keep only the policy that allows store owners to view their orders
-- This ensures privacy: only authenticated store owners can see their own orders
-- When you need customer order tracking, add a tracking_token column and new policy