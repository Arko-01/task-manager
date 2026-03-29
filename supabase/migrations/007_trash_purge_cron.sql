-- Enable pg_cron extension (requires Supabase Pro plan or self-hosted)
-- If pg_cron is not available, this migration will fail gracefully.
-- In that case, you can run the DELETE manually or via an Edge Function on a schedule.

-- Create extension if available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: permanently delete tasks that have been in trash for 30+ days
-- Runs daily at 3:00 AM UTC
SELECT cron.schedule(
  'purge-old-trash',
  '0 3 * * *',
  $$DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'$$
);
