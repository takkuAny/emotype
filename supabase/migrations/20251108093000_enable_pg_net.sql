-- Enable pg_net extension for outbound HTTP requests from Postgres
create extension if not exists pg_net with schema extensions;

-- Ensure the postgres role (used by pg_cron jobs) can access the net schema
grant usage on schema net to postgres;
grant all privileges on all tables in schema net to postgres;
grant all privileges on all functions in schema net to postgres;
