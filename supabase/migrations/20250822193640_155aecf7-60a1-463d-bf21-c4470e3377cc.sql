-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('business-portfolio', 'business-portfolio', true),
  ('staff-avatars', 'staff-avatars', true);

-- Create RLS policies for business portfolio bucket
CREATE POLICY "Business owners can upload portfolio images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business owners can view their portfolio images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'business-portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business owners can delete their portfolio images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view business portfolio images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-portfolio');

-- Create RLS policies for staff avatars bucket
CREATE POLICY "Business owners can upload staff avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'staff-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business owners can view their staff avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'staff-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business owners can delete their staff avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'staff-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view staff avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'staff-avatars');