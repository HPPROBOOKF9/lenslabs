-- Add section column to admin_activity_log for better organization
ALTER TABLE public.admin_activity_log 
ADD COLUMN section text;

-- Add index for better query performance
CREATE INDEX idx_admin_activity_log_section ON public.admin_activity_log(section);
CREATE INDEX idx_admin_activity_log_admin_section ON public.admin_activity_log(admin_id, section);