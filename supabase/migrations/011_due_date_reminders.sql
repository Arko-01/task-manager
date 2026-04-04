-- Due date reminder notifications
--
-- Creates a function that generates notifications for tasks that are:
--   - Due tomorrow (due_tomorrow)
--   - Due today (due_today)
--   - Overdue (overdue)
--
-- A pg_cron job runs this function daily at 8:00 AM UTC.
-- The function is idempotent — duplicate notifications for the same
-- task+user+type on the same day are prevented via NOT EXISTS checks.

CREATE OR REPLACE FUNCTION public.send_due_date_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  rec RECORD;
  overdue_days INT;
  safe_title TEXT;
BEGIN
  -- Due tomorrow
  FOR rec IN
    SELECT t.id AS task_id, t.title AS task_title, t.project_id, ta.user_id
    FROM public.tasks t
    JOIN public.task_assignees ta ON ta.task_id = t.id
    WHERE t.end_date = CURRENT_DATE + 1
      AND t.status != 'done'
      AND t.deleted_at IS NULL
      AND t.archived_at IS NULL
  LOOP
    safe_title := replace(replace(COALESCE(rec.task_title, 'Untitled task'), '%', '\%'), '_', '\_');

    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT
      rec.user_id,
      'due_tomorrow',
      'Task due tomorrow',
      '"' || COALESCE(rec.task_title, 'Untitled task') || '" is due tomorrow',
      '/projects/' || rec.project_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = rec.user_id
        AND n.type = 'due_tomorrow'
        AND n.body LIKE '%"' || safe_title || '" is due tomorrow%' ESCAPE '\'
        AND n.created_at::date = CURRENT_DATE
    );
  END LOOP;

  -- Due today
  FOR rec IN
    SELECT t.id AS task_id, t.title AS task_title, t.project_id, ta.user_id
    FROM public.tasks t
    JOIN public.task_assignees ta ON ta.task_id = t.id
    WHERE t.end_date = CURRENT_DATE
      AND t.status != 'done'
      AND t.deleted_at IS NULL
      AND t.archived_at IS NULL
  LOOP
    safe_title := replace(replace(COALESCE(rec.task_title, 'Untitled task'), '%', '\%'), '_', '\_');

    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT
      rec.user_id,
      'due_today',
      'Task due today',
      '"' || COALESCE(rec.task_title, 'Untitled task') || '" is due today',
      '/projects/' || rec.project_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = rec.user_id
        AND n.type = 'due_today'
        AND n.body LIKE '%"' || safe_title || '" is due today%' ESCAPE '\'
        AND n.created_at::date = CURRENT_DATE
    );
  END LOOP;

  -- Overdue
  FOR rec IN
    SELECT t.id AS task_id, t.title AS task_title, t.project_id, t.end_date, ta.user_id
    FROM public.tasks t
    JOIN public.task_assignees ta ON ta.task_id = t.id
    WHERE t.end_date < CURRENT_DATE
      AND t.status != 'done'
      AND t.deleted_at IS NULL
      AND t.archived_at IS NULL
  LOOP
    overdue_days := (CURRENT_DATE - rec.end_date);
    safe_title := replace(replace(COALESCE(rec.task_title, 'Untitled task'), '%', '\%'), '_', '\_');

    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT
      rec.user_id,
      'overdue',
      'Task overdue',
      '"' || COALESCE(rec.task_title, 'Untitled task') || '" is overdue by ' || overdue_days || ' day' || CASE WHEN overdue_days > 1 THEN 's' ELSE '' END,
      '/projects/' || rec.project_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = rec.user_id
        AND n.type = 'overdue'
        AND n.body LIKE '%"' || safe_title || '%" is overdue%' ESCAPE '\'
        AND n.created_at::date = CURRENT_DATE
    );
  END LOOP;
END;
$$;

-- Schedule the reminder function to run daily at 8:00 AM UTC
SELECT cron.schedule(
  'due-date-reminders',
  '0 8 * * *',
  $$SELECT public.send_due_date_reminders()$$
);
