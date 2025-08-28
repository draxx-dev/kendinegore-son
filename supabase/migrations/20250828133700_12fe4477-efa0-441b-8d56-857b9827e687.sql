-- Add password and permission fields to staff table
ALTER TABLE public.staff 
ADD COLUMN password_hash text,
ADD COLUMN temp_password text,
ADD COLUMN permissions jsonb DEFAULT '{}';

-- Create staff_permissions table for more detailed permission management
CREATE TABLE public.staff_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default permissions
INSERT INTO public.staff_permissions (name, description, category) VALUES
  ('view_appointments', 'Randevuları görüntüleme', 'appointments'),
  ('create_appointments', 'Randevu oluşturma', 'appointments'),
  ('edit_appointments', 'Randevu düzenleme', 'appointments'),
  ('delete_appointments', 'Randevu silme', 'appointments'),
  ('view_customers', 'Müşterileri görüntüleme', 'customers'),
  ('create_customers', 'Müşteri oluşturma', 'customers'),
  ('edit_customers', 'Müşteri düzenleme', 'customers'),
  ('delete_customers', 'Müşteri silme', 'customers'),
  ('view_services', 'Hizmetleri görüntüleme', 'services'),
  ('edit_services', 'Hizmet düzenleme', 'services'),
  ('view_payments', 'Ödemeleri görüntüleme', 'payments'),
  ('edit_payments', 'Ödeme düzenleme', 'payments'),
  ('view_reports', 'Raporları görüntüleme', 'reports'),
  ('manage_staff', 'Personel yönetimi', 'staff'),
  ('view_business_settings', 'İşletme ayarları görüntüleme', 'business');

-- Create staff_role_assignments table to link staff with permissions
CREATE TABLE public.staff_role_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.staff_permissions(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_id, permission_id)
);

-- Enable RLS on new tables
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_permissions (business owners can view all)
CREATE POLICY "Business owners can view all permissions" 
ON public.staff_permissions 
FOR SELECT 
USING (true);

-- Create policies for staff_role_assignments
CREATE POLICY "Business owners can manage staff permissions" 
ON public.staff_role_assignments 
FOR ALL 
USING (
  staff_id IN (
    SELECT staff.id FROM staff 
    JOIN businesses ON staff.business_id = businesses.id 
    WHERE businesses.owner_id = auth.uid()
  )
);

-- Create function to check if staff has permission
CREATE OR REPLACE FUNCTION public.staff_has_permission(staff_id_param uuid, permission_name_param text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_role_assignments sra
    JOIN public.staff_permissions sp ON sra.permission_id = sp.id
    WHERE sra.staff_id = staff_id_param
      AND sp.name = permission_name_param
  );
$$;

-- Create staff auth function for login
CREATE OR REPLACE FUNCTION public.authenticate_staff(business_email_param text, staff_password_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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