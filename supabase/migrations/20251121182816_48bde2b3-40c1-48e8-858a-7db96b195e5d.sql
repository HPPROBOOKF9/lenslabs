-- Extend admins table with additional fields
ALTER TABLE public.admins 
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen'));

-- Create admin_permissions table for granular access control
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
  section TEXT NOT NULL,
  can_access BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(admin_id, section)
);

-- Enable RLS on admin_permissions
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Create admin_activity_log table to track all admin actions
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_activity_log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_permissions
CREATE POLICY "Only admins can view permissions"
ON public.admin_permissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert permissions"
ON public.admin_permissions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update permissions"
ON public.admin_permissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete permissions"
ON public.admin_permissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for admin_activity_log
CREATE POLICY "Only admins can view activity logs"
ON public.admin_activity_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update admins table RLS to allow inserts
CREATE POLICY "Admins can insert admins"
ON public.admins
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update admins"
ON public.admins
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete admins"
ON public.admins
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));