-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Add policy for service role to insert alerts (for edge functions)
CREATE POLICY "Service role can insert alerts"
ON public.alerts
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add policy for service role to read ad_accounts (for edge functions)
CREATE POLICY "Service role can read ad accounts"
ON public.ad_accounts
FOR SELECT
TO service_role
USING (true);