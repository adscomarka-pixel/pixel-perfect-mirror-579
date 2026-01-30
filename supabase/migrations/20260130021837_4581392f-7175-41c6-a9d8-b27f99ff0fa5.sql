-- Add column for balance alert days (array of weekdays)
ALTER TABLE public.notification_settings
ADD COLUMN IF NOT EXISTS balance_alert_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

-- Add comment for documentation
COMMENT ON COLUMN public.notification_settings.balance_alert_days IS 'Days of the week when balance alerts should be checked and sent';