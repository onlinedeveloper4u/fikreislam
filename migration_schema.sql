CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'contributor',
    'user'
);


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'contributor' THEN 2 
      WHEN 'user' THEN 3 
    END
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



-- Create content status enum
CREATE TYPE public.content_status AS ENUM ('pending', 'approved', 'rejected');

-- Create content type enum
CREATE TYPE public.content_type AS ENUM ('book', 'audio', 'video');

-- Create content table (unified for all content types)
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.content_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  language TEXT DEFAULT 'English',
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  cover_image_url TEXT,
  status public.content_status NOT NULL DEFAULT 'pending'::public.content_status,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Users can view only approved content
CREATE POLICY "Users can view approved content"
ON public.content
FOR SELECT
USING (status = 'approved');

-- Contributors can view their own content (any status)
CREATE POLICY "Contributors can view own content"
ON public.content
FOR SELECT
USING (auth.uid() = contributor_id);

-- Contributors can insert content (pending by default)
CREATE POLICY "Contributors can insert content"
ON public.content
FOR INSERT
WITH CHECK (
  auth.uid() = contributor_id 
  AND public.has_role(auth.uid(), 'contributor'::public.app_role)
);

-- Contributors can update their own pending/rejected content
CREATE POLICY "Contributors can update own pending content"
ON public.content
FOR UPDATE
USING (
  auth.uid() = contributor_id 
  AND status IN ('pending', 'rejected')
);

-- Admins can view all content
CREATE POLICY "Admins can view all content"
ON public.content
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can update any content (for approval)
CREATE POLICY "Admins can update all content"
ON public.content
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can delete content
CREATE POLICY "Admins can delete content"
ON public.content
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Contributors can delete their own pending content
CREATE POLICY "Contributors can delete own pending content"
ON public.content
FOR DELETE
USING (
  auth.uid() = contributor_id 
  AND status = 'pending'
);

-- Create trigger for updated_at
CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public) VALUES ('content-files', 'content-files', true);

-- Storage policies
CREATE POLICY "Anyone can view content files"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-files');

CREATE POLICY "Contributors can upload content files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Contributors can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete content files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-files'
);
-- Fix: Restrict profiles SELECT policy to only allow users to view their own profile
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a restrictive policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);-- Fix storage policies to properly check user roles

-- Drop existing problematic storage policies
DROP POLICY IF EXISTS "Contributors can upload content files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete content files" ON storage.objects;

-- Create new INSERT policy that properly checks for contributor or admin role
CREATE POLICY "Contributors and admins can upload content files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-files'
  AND (
    public.has_role(auth.uid(), 'contributor'::public.app_role) 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Create new DELETE policy that properly checks for admin role
CREATE POLICY "Admins can delete content files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-files'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_items table
CREATE TABLE public.playlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, content_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Playlists policies
CREATE POLICY "Users can view own playlists"
ON public.playlists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create playlists"
ON public.playlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
ON public.playlists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
ON public.playlists FOR DELETE
USING (auth.uid() = user_id);

-- Playlist items policies
CREATE POLICY "Users can view own playlist items"
ON public.playlist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_items.playlist_id
    AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add items to own playlists"
ON public.playlist_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_items.playlist_id
    AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own playlist items"
ON public.playlist_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_items.playlist_id
    AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove items from own playlists"
ON public.playlist_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_items.playlist_id
    AND playlists.user_id = auth.uid()
  )
);

-- Create trigger for playlists updated_at
CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create content analytics table
CREATE TABLE public.content_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'download', 'play')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (for tracking views/downloads)
CREATE POLICY "Anyone can track content actions"
ON public.content_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.content_analytics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Contributors can view analytics for their own content
CREATE POLICY "Contributors can view analytics for own content"
ON public.content_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.content
    WHERE content.id = content_analytics.content_id
    AND content.contributor_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_content_analytics_content_id ON public.content_analytics(content_id);
CREATE INDEX idx_content_analytics_created_at ON public.content_analytics(created_at);-- Create a trigger function to assign default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-assign role
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();-- Fix 1: Make the content-files storage bucket private
UPDATE storage.buckets SET public = false WHERE id = 'content-files';

-- Fix 2: Replace overly permissive content_analytics INSERT policy
-- Anyone could insert any data before - now we ensure content_id exists and limit what can be inserted
DROP POLICY IF EXISTS "Anyone can track content actions" ON public.content_analytics;

-- Allow authenticated and anonymous users to track actions, but only for valid content
CREATE POLICY "Anyone can track valid content actions"
ON public.content_analytics
FOR INSERT
WITH CHECK (
  -- Content must exist and be approved (public content only)
  EXISTS (
    SELECT 1 FROM public.content 
    WHERE id = content_analytics.content_id 
    AND status = 'approved'
  )
  -- If user is authenticated, user_id must match or be null
  AND (
    auth.uid() IS NULL 
    OR user_id IS NULL 
    OR user_id = auth.uid()
  )
);

-- Fix 3: Add storage policy for signed URL access (authenticated users can read approved content files)
-- First, clean up any existing policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can view approved content files" ON storage.objects;

-- Users can only access files from approved content via signed URLs
CREATE POLICY "Authenticated users can view approved content files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-files' 
  AND (
    -- Check if this file belongs to approved content
    EXISTS (
      SELECT 1 FROM public.content 
      WHERE status = 'approved' 
      AND (
        file_url LIKE '%' || name 
        OR cover_image_url LIKE '%' || name
      )
    )
    -- Or the user owns this file (contributors can access their own uploads)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);-- Create a public view for approved content that excludes sensitive fields
-- This provides an additional layer of security for public content access

CREATE OR REPLACE VIEW public.content_public AS
SELECT 
  id, 
  type, 
  title, 
  description, 
  author, 
  language, 
  tags,
  file_url, 
  cover_image_url, 
  status, 
  published_at, 
  created_at
FROM public.content
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.content_public TO anon, authenticated;

-- Add a comment explaining the view's purpose
COMMENT ON VIEW public.content_public IS 'Public view of approved content excluding sensitive fields like contributor_id and admin_notes';-- Fix the SECURITY DEFINER view issue by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.content_public;

CREATE VIEW public.content_public
WITH (security_invoker = true)
AS
SELECT 
  id, 
  type, 
  title, 
  description, 
  author, 
  language, 
  tags,
  file_url, 
  cover_image_url, 
  status, 
  published_at, 
  created_at
FROM public.content
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.content_public TO anon, authenticated;

-- Add a comment explaining the view's purpose
COMMENT ON VIEW public.content_public IS 'Public view of approved content excluding sensitive fields like contributor_id and admin_notes. Uses security_invoker=true to respect RLS policies.';-- Simplify storage RLS policy to rely on signed URLs for public access
-- The signed URL mechanism in src/lib/storage.ts provides the actual security boundary

-- Drop the unreliable LIKE-based policy
DROP POLICY IF EXISTS "Authenticated users can view approved content files" ON storage.objects;

-- Create simpler policy: only allow contributors to directly access their own files
-- Public access is handled via signed URLs generated by the application
CREATE POLICY "Contributors can access own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure contributors can still upload to their own folders
DROP POLICY IF EXISTS "Contributors can upload files" ON storage.objects;
CREATE POLICY "Contributors can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow contributors to update their own files
DROP POLICY IF EXISTS "Contributors can update own files" ON storage.objects;
CREATE POLICY "Contributors can update own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'content-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow contributors to delete their own files
DROP POLICY IF EXISTS "Contributors can delete own files" ON storage.objects;
CREATE POLICY "Contributors can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'content-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);-- Add RLS policy for admins to view all profiles
-- This allows the User Management dashboard to display user names
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));-- Fix 1: Allow admins to insert content
-- Admins should be able to upload content as well
CREATE POLICY "Admins can insert content"
ON public.content
FOR INSERT
WITH CHECK (
  auth.uid() = contributor_id 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Fix 2: The profiles SELECT policies are both RESTRICTIVE, which means ALL must pass
-- We need to change them to PERMISSIVE so that ANY can pass
-- First, drop the existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies (default type)
-- This means if ANY policy passes, access is granted
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type public.content_type NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table with approval workflow
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answered_by UUID NOT NULL,
  answer TEXT NOT NULL,
  status public.content_status NOT NULL DEFAULT 'pending'::public.content_status,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Questions policies: Anyone authenticated can ask, everyone can view
CREATE POLICY "Anyone can view questions"
ON public.questions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can ask questions"
ON public.questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
ON public.questions FOR DELETE
USING (auth.uid() = user_id);

-- Answers policies
CREATE POLICY "Anyone can view approved answers"
ON public.answers FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can view all answers"
ON public.answers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Contributors can view own answers"
ON public.answers FOR SELECT
USING (auth.uid() = answered_by);

CREATE POLICY "Contributors can submit answers"
ON public.answers FOR INSERT
WITH CHECK (
  (auth.uid() = answered_by) AND 
  (public.has_role(auth.uid(), 'contributor'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "Admins can update all answers"
ON public.answers FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Contributors can update own pending answers"
ON public.answers FOR UPDATE
USING (auth.uid() = answered_by AND status = 'pending'::public.content_status);

CREATE POLICY "Admins can delete answers"
ON public.answers FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow users to update their own questions
CREATE POLICY "Users can update own questions"
ON public.questions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);