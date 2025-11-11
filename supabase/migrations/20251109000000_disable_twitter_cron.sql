-- Disable twitter-auto-sync cron job to stop scheduled executions
select cron.unschedule('twitter-auto-sync');
