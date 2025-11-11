-- Update twitter auto sync cron to run every 15 minutes
do $$
begin
  perform cron.unschedule('twitter-auto-sync');
exception
  when others then
    null;
end $$;

select cron.schedule(
  'twitter-auto-sync',
  '*/15 * * * *',
  $$
  with cron_token as (
    select
      coalesce(
        vault.get_secret('CRON_TWITTER_TOKEN'),
        ''
      ) as token
  )
  select
    net.http_post(
      url := 'https://wgeqmsyjdjsoqnleahkb.supabase.co/functions/v1/twitter-auto-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || cron_token.token,
        'X-Cron-Token', cron_token.token
      ),
      body := '{}'::jsonb
    ) as request_id
  from cron_token;
  $$
);
