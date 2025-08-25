-- Add visibility settings for contact info in online booking
ALTER TABLE public.businesses 
ADD COLUMN show_email_in_booking BOOLEAN DEFAULT true,
ADD COLUMN show_phone_in_booking BOOLEAN DEFAULT true;