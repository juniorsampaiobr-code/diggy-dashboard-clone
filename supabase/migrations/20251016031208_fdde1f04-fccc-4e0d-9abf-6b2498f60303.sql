-- Add is_weighable column to products table
ALTER TABLE public.products 
ADD COLUMN is_weighable boolean DEFAULT false;