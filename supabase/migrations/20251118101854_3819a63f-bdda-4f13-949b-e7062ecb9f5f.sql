-- Add trigger to automatically assign admin role to first user who signs up
-- This bootstraps the admin system by giving the first user admin privileges

CREATE OR REPLACE FUNCTION public.handle_new_user_admin_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- If this is the first user, make them an admin
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after user signup
DROP TRIGGER IF EXISTS on_auth_user_created_admin_bootstrap ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_bootstrap
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_admin_bootstrap();