-- Migration to schedule the global balance sync job every 30 minutes
-- This requires pg_cron and pg_net extensions (already enabled in previous migrations)

-- Schedule the job
-- Note: Replace the URL with your actual project URL if deploying to production.
-- For local development with Supabase CLI, use http://host.docker.internal:54321/functions/v1/sync-all-balances
SELECT
  cron.schedule(
    'sync-all-balances-cron', -- name of the cron job
    '*/30 * * * *',           -- every 30 minutes
    $$
    SELECT
      net.http_post(
        url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/sync-all-balances',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('vault.service_role_key') -- This assumes service_role_key is in vault or similar
        ),
        body := '{}'::jsonb
      )
    $$
  );

-- If the above dynamic URL doesn't work in your environment, use a static one:
-- SELECT cron.schedule('sync-all-balances-cron', '*/30 * * * *', $$ SELECT net.http_post(url := 'YOUR_SUPABASE_URL/functions/v1/sync-all-balances', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb, body := '{}'::jsonb) $$);
