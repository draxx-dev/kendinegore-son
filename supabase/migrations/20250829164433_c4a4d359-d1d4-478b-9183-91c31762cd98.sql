-- Update staff table to use permanent passwords instead of temporary ones
ALTER TABLE public.staff 
RENAME COLUMN temp_password TO password;

-- Update the authenticate_staff function to use the new password column
DROP FUNCTION IF EXISTS public.authenticate_staff(text, text);

CREATE OR REPLACE FUNCTION public.authenticate_staff(business_email_param text, staff_password_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_record record;
  business_record record;
  result jsonb;
BEGIN
  -- Find business by email
  SELECT * INTO business_record
  FROM public.businesses
  WHERE email = business_email_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'İşletme bulunamadı');
  END IF;

  -- Find staff with matching password in this business
  SELECT * INTO staff_record
  FROM public.staff
  WHERE business_id = business_record.id 
    AND password = staff_password_param
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geçersiz şifre');
  END IF;

  -- Return success with staff info
  result := jsonb_build_object(
    'success', true,
    'staff', jsonb_build_object(
      'id', staff_record.id,
      'name', staff_record.name,
      'email', staff_record.email,
      'business_id', staff_record.business_id,
      'business_name', business_record.name
    )
  );

  RETURN result;
END;
$$;