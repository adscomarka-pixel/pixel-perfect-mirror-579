-- Migration to schedule the automation process every hour
-- This job will check notification settings and trigger reports/scans as needed

-- Schedule the job
SELECT
  cron.schedule(
    'process-automation-cron', -- name of the cron job
    '0 * * * *',               -- every hour at minute 0
    $$
    SELECT
      net.http_post(
        url := 'https://qcmelqgtuogewevwsfwh.supabase.co/functions/v1/process-automation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('vault.service_role_key')
        ),
        body := '{}'::jsonb
      )
    $$
  );
