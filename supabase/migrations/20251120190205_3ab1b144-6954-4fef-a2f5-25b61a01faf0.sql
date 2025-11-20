-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on brands table
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create policies for brands table
CREATE POLICY "Authenticated users can view brands" 
ON public.brands 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert brands" 
ON public.brands 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update brands" 
ON public.brands 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete brands" 
ON public.brands 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add brand_id column to listings table
ALTER TABLE public.listings ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_listings_brand_id ON public.listings(brand_id);

-- Remove parent_id from categories (convert subcategories back to regular categories)
ALTER TABLE public.categories DROP COLUMN parent_id;