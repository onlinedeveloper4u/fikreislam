-- RPC for Admin to see user details including email and metadata
-- Run this in the Supabase SQL Editor

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
