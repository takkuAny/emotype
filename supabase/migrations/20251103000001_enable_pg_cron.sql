-- Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;

-- Grant usage on cron schema to postgres role
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
