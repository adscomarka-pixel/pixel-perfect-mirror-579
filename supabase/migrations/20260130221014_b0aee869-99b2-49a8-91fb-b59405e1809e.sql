-- Add balance_alert_time column for configuring when balance checks should run
ALTER TABLE public.notification_settings
ADD COLUMN balance_alert_time TEXT DEFAULT '09:00';