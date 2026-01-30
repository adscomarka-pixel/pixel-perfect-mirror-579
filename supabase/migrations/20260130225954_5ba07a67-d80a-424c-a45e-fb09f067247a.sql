-- Remove the overly permissive service role policy that allows unrestricted access to sensitive tokens
DROP POLICY IF EXISTS "Service role can read ad accounts" ON public.ad_accounts;