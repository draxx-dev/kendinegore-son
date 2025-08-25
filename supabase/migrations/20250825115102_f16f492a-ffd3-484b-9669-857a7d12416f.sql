-- Public booking için businesses tablosuna public görüntüleme policy'si ekle
CREATE POLICY "Anyone can view businesses for booking" 
ON public.businesses 
FOR SELECT 
USING (true);