-- İlk olarak eksik profil ve işletme kayıtlarını oluşturmak için fonksiyonlar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Profil kaydı oluştur
  INSERT INTO public.profiles (user_id, first_name, last_name, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name', 
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- İşletme kaydı oluştur
  INSERT INTO public.businesses (owner_id, name, slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Benim İşletmem') || ' İşletmesi',
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'benim-isletmem'), ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mevcut kullanıcı için profil ve işletme kaydı oluştur
DO $$
DECLARE
  current_user_id uuid := 'c991032c-1ff6-4458-818c-68ff42c99bc8';
  user_record record;
BEGIN
  -- Kullanıcı bilgilerini al
  SELECT * INTO user_record FROM auth.users WHERE id = current_user_id;
  
  IF user_record.id IS NOT NULL THEN
    -- Profil kaydı yoksa oluştur
    INSERT INTO public.profiles (user_id, first_name, last_name, phone)
    VALUES (
      current_user_id,
      user_record.raw_user_meta_data ->> 'first_name',
      user_record.raw_user_meta_data ->> 'last_name',
      user_record.raw_user_meta_data ->> 'phone'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- İşletme kaydı yoksa oluştur
    INSERT INTO public.businesses (owner_id, name, slug)
    VALUES (
      current_user_id,
      COALESCE(user_record.raw_user_meta_data ->> 'first_name', 'Benim İşletmem') || ' İşletmesi',
      LOWER(REPLACE(COALESCE(user_record.raw_user_meta_data ->> 'first_name', 'benim-isletmem'), ' ', '-')) || '-' || SUBSTRING(current_user_id::text, 1, 8)
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Customers tablosunda telefon numarası için unique constraint ekle (işletme bazında)
ALTER TABLE public.customers 
ADD CONSTRAINT customers_phone_business_unique 
UNIQUE (business_id, phone);

-- Services tablosunda business_id foreign key constraint ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'services_business_id_fkey'
  ) THEN
    ALTER TABLE public.services 
    ADD CONSTRAINT services_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Staff tablosunda business_id foreign key constraint ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'staff_business_id_fkey'
  ) THEN
    ALTER TABLE public.staff 
    ADD CONSTRAINT staff_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Customers tablosunda business_id foreign key constraint ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'customers_business_id_fkey'
  ) THEN
    ALTER TABLE public.customers 
    ADD CONSTRAINT customers_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
  END IF;
END $$;