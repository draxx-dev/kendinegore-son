-- Add expected payment date column to payments table
ALTER TABLE public.payments ADD COLUMN expected_payment_date DATE;