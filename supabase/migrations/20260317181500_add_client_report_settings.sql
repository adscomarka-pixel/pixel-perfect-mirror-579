-- Add report automation settings to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS report_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS report_day TEXT DEFAULT 'monday',
ADD COLUMN IF NOT EXISTS report_time TEXT DEFAULT '09:00';

-- Comment for clarity
COMMENT ON COLUMN public.clients.report_enabled IS 'Indicates if the weekly report is enabled for this client.';
COMMENT ON COLUMN public.clients.report_day IS 'The day of the week to send the report.';
COMMENT ON COLUMN public.clients.report_time IS 'The time of day to send the report.';
