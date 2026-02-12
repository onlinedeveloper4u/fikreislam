-- 1. Consolidated master trigger for new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with name from metadata safety
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'Unnamed User')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name
  WHERE profiles.full_name IS NULL OR profiles.full_name = 'Unnamed User';
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_setup ON auth.users;

CREATE TRIGGER on_auth_user_created_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_setup();

-- 2. Backfill existing data
INSERT INTO public.profiles (user_id, full_name, created_at, updated_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', 'User ' || substr(id::text, 1, 8)),
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. RPC for Admin to see user details including email and metadata
-- We must DROP the function FIRST because we changed the return type (renamed 'role' to 'user_role')
DROP FUNCTION IF EXISTS public.get_users_with_metadata();

CREATE OR REPLACE FUNCTION public.get_users_with_metadata()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  user_role public.app_role,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can access this data';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(p.full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', 'Unnamed User')::TEXT as full_name,
    ur.role as user_role,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE ur.role != 'admin' OR ur.role IS NULL
  ORDER BY u.created_at DESC;
END;
$$;
