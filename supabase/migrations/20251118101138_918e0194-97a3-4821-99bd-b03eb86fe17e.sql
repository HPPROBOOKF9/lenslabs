-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policy for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow read on admins" ON public.admins;
DROP POLICY IF EXISTS "Allow all operations on listings" ON public.listings;
DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;

-- Secure admins table - only admins can view
CREATE POLICY "Only admins can view admins"
ON public.admins
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Secure listings table
CREATE POLICY "Authenticated users can view listings"
ON public.listings
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert listings"
ON public.listings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update listings"
ON public.listings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete listings"
ON public.listings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Secure categories table
CREATE POLICY "Authenticated users can view categories"
ON public.categories
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));