-- Fix security warnings by setting search_path on functions
DROP FUNCTION IF EXISTS public.staff_has_permission(uuid, text);
DROP FUNCTION IF EXISTS public.authenticate_staff(text, text);

-- Recreate staff_has_permission function with proper search_path
CREATE OR REPLACE FUNCTION public.staff_has_permission(staff_id_param uuid, permission_name_param text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_role_assignments sra
    JOIN public.staff_permissions sp ON sra.permission_id = sp.id
    WHERE sra.staff_id = staff_id_param
      AND sp.name = permission_name_param
  );
$$;

-- Recreate authenticate_staff function with proper search_path
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

  -- Find staff with matching temp_password in this business
  SELECT * INTO staff_record
  FROM public.staff
  WHERE business_id = business_record.id 
    AND temp_password = staff_password_param
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