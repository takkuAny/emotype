-- Delete existing job if any
do $$
begin
  perform cron.unschedule('twitter-auto-sync');
exception
  when others then
    null;
end $$;

-- Schedule the cron job (URLとキーを直接指定)
select cron.schedule(
  'twitter-auto-sync',
  '0 */6 * * *',
  $$
  select
    net.http_post(
      url := 'https://wgeqmsyjdjsoqnleahkb.supabase.co/functions/v1/twitter-auto-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZXFtc3lqZGpzb3FubGVhaGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2MjQwOTQsImV4cCI6MjA0NjIwMDA5NH0.a0HXz3Tl5kXUEQRXYHfuAH_wnbu3ECvEk5ExKVAvVUo'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);