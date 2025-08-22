-- Güvenlik uyarılarını düzeltme: Function Search Path ayarları

-- update_updated_at_column fonksiyonunu güvenli hale getir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- create_default_working_hours fonksiyonunu güvenli hale getir
CREATE OR REPLACE FUNCTION public.create_default_working_hours(business_id_param UUID)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pazartesi-Cumartesi arası 09:00-18:00
  INSERT INTO public.working_hours (business_id, day_of_week, start_time, end_time, is_closed)
  VALUES 
    (business_id_param, 1, '09:00', '18:00', false), -- Pazartesi
    (business_id_param, 2, '09:00', '18:00', false), -- Salı
    (business_id_param, 3, '09:00', '18:00', false), -- Çarşamba
    (business_id_param, 4, '09:00', '18:00', false), -- Perşembe
    (business_id_param, 5, '09:00', '18:00', false), -- Cuma
    (business_id_param, 6, '09:00', '18:00', false), -- Cumartesi
    (business_id_param, 0, '09:00', '18:00', true);  -- Pazar (kapalı)
END;
$$;

-- handle_new_business fonksiyonunu güvenli hale getir
CREATE OR REPLACE FUNCTION public.handle_new_business()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_default_working_hours(NEW.id);
  RETURN NEW;
END;
$$;