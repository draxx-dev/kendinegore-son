-- Add appointment_group_id to group multiple services for same appointment
ALTER TABLE public.appointments 
ADD COLUMN appointment_group_id UUID DEFAULT gen_random_uuid();

-- Update existing appointments to have the same group_id if they are for the same customer, date, and time
UPDATE public.appointments 
SET appointment_group_id = (
  SELECT gen_random_uuid()
) 
WHERE appointment_group_id IS NULL;

-- Create expenses table for business expenses tracking
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for business owners to manage their expenses
CREATE POLICY "Business owners can manage their expenses" 
ON public.expenses 
FOR ALL 
USING (business_id IN (
  SELECT businesses.id 
  FROM businesses 
  WHERE businesses.owner_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();