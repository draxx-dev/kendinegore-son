-- Add district column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN district TEXT;

-- Create function to generate unique slug from business name
CREATE OR REPLACE FUNCTION public.generate_business_slug(business_name TEXT, city_name TEXT DEFAULT NULL, district_name TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Convert business name to slug format
    base_slug := LOWER(TRIM(REGEXP_REPLACE(business_name, '[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]', '', 'g')));
    base_slug := REPLACE(base_slug, 'ğ', 'g');
    base_slug := REPLACE(base_slug, 'ü', 'u');
    base_slug := REPLACE(base_slug, 'ş', 's');
    base_slug := REPLACE(base_slug, 'ı', 'i');
    base_slug := REPLACE(base_slug, 'ö', 'o');
    base_slug := REPLACE(base_slug, 'ç', 'c');
    base_slug := REPLACE(base_slug, 'Ğ', 'g');
    base_slug := REPLACE(base_slug, 'Ü', 'u');
    base_slug := REPLACE(base_slug, 'Ş', 's');
    base_slug := REPLACE(base_slug, 'İ', 'i');
    base_slug := REPLACE(base_slug, 'Ö', 'o');
    base_slug := REPLACE(base_slug, 'Ç', 'c');
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := TRIM(base_slug, '-');
    
    final_slug := base_slug;
    
    -- Check if slug exists
    WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = final_slug) LOOP
        -- Try with city
        IF city_name IS NOT NULL AND counter = 1 THEN
            final_slug := base_slug || '-' || LOWER(REPLACE(city_name, ' ', '-'));
        -- Try with district  
        ELSIF district_name IS NOT NULL AND counter = 2 THEN
            final_slug := base_slug || '-' || LOWER(REPLACE(city_name, ' ', '-')) || '-' || LOWER(REPLACE(district_name, ' ', '-'));
        -- Add number
        ELSE
            final_slug := base_slug || '-' || counter::TEXT;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 100 THEN
            final_slug := base_slug || '-' || EXTRACT(epoch FROM now())::TEXT;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Update handle_new_user function to use new slug generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    business_name TEXT;
    generated_slug TEXT;
BEGIN
    -- Profil kaydı oluştur
    INSERT INTO public.profiles (user_id, first_name, last_name, phone)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name', 
        NEW.raw_user_meta_data ->> 'phone'
    );
    
    -- İşletme adını belirle
    business_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Benim İşletmem') || ' İşletmesi';
    
    -- Slug oluştur
    generated_slug := public.generate_business_slug(business_name);
    
    -- İşletme kaydı oluştur
    INSERT INTO public.businesses (owner_id, name, slug)
    VALUES (
        NEW.id,
        business_name,
        generated_slug
    );
    
    RETURN NEW;
END;
$function$;