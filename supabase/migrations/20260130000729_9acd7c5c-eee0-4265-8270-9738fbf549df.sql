-- Add report_objectives column to ad_accounts table
-- This stores an array of campaign objectives for report generation
ALTER TABLE public.ad_accounts 
ADD COLUMN report_objectives text[] DEFAULT ARRAY['MESSAGES']::text[];

-- Add a comment explaining the column
COMMENT ON COLUMN public.ad_accounts.report_objectives IS 'Array of Meta campaign objectives for report generation: MESSAGES, LEADS, CONVERSIONS, TRAFFIC, ENGAGEMENT';