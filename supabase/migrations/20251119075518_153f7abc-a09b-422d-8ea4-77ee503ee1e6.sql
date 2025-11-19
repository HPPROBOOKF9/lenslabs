-- Add deleted_at column to listings for soft delete
ALTER TABLE public.listings 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Add parent_id column to categories for subcategories
ALTER TABLE public.categories 
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE DEFAULT NULL;

-- Add index for better performance on deleted listings queries
CREATE INDEX idx_listings_deleted_at ON public.listings(deleted_at);

-- Add index for subcategories
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);