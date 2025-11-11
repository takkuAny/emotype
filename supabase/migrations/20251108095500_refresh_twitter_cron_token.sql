-- Reschedule twitter auto sync cron using vault secret
DO $$
BEGIN
  PERFORM cron.unschedule('twitter-auto-sync');
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

SELECT cron.schedule(
  'twitter-auto-sync',
  '*/15 * * * *',
  $$
  WITH cron_token AS (
    SELECT COALESCE(vault.get_secret('CRON_TWITTER_TOKEN'), '') AS token
  )
  SELECT
    net.http_post(
      url := 'https://wgeqmsyjdjsoqnleahkb.supabase.co/functions/v1/twitter-auto-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || cron_token.token,
        'X-Cron-Token', cron_token.token
      ),
      body := '{}'::jsonb
    ) AS request_id
  FROM cron_token;
  $$
);
