-- Trash auto-purge: permanently delete tasks trashed 30+ days ago
--
-- HOW TO APPLY (Supabase free tier):
-- 1. Go to Supabase Dashboard > Database > Extensions
-- 2. Search "pg_cron" and enable it
-- 3. Go to SQL Editor and run this entire file
--
-- To verify: SELECT * FROM cron.job;
-- To remove: SELECT cron.unschedule('purge-old-trash');

-- Enable pg_cron (must be enabled via Dashboard Extensions first on hosted Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role (required on some Supabase setups)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule: permanently delete tasks trashed 30+ days ago
-- Runs daily at 3:00 AM UTC
SELECT cron.schedule(
  'purge-old-trash',
  '0 3 * * *',
  $$DELETE FROM public.tasks WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'$$
);
