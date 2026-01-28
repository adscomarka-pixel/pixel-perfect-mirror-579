-- Drop the existing has_role function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role app_role) CASCADE;

-- Create a temporary column to store the role as text
ALTER TABLE public.user_roles ADD COLUMN role_text text;

-- Copy existing roles to the text column
UPDATE public.user_roles SET role_text = role::text;

-- Drop the role column
ALTER TABLE public.user_roles DROP COLUMN role;

-- Drop the old enum
DROP TYPE public.app_role;

-- Create the new enum with the updated roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'leitor');

-- Add the new role column with the new enum type
ALTER TABLE public.user_roles ADD COLUMN role public.app_role;

-- Migrate the data: admin stays admin, user becomes leitor
UPDATE public.user_roles SET role = 
  CASE 
    WHEN role_text = 'admin' THEN 'admin'::public.app_role
    ELSE 'leitor'::public.app_role
  END;

-- Make the role column not null
ALTER TABLE public.user_roles ALTER COLUMN role SET NOT NULL;

-- Drop the temporary column
ALTER TABLE public.user_roles DROP COLUMN role_text;

-- Recreate the has_role function with the new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a function to check if user has admin or gestor role
CREATE OR REPLACE FUNCTION public.has_admin_or_gestor_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'gestor')
  )
$$;

-- Recreate the RLS policies for user_roles
CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Recreate the RLS policies for profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
USING (has_role(auth.uid(), 'admin'));