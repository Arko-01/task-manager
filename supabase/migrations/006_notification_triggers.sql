-- Auto-create notifications for key events

-- 1. Notify on task assignment
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
  assigner_name TEXT;
  project_id UUID;
BEGIN
  -- Don't notify if assigning yourself
  IF NEW.user_id = auth.uid() THEN RETURN NEW; END IF;

  SELECT t.title, t.project_id INTO task_title, project_id
  FROM public.tasks t WHERE t.id = NEW.task_id;

  SELECT p.full_name INTO assigner_name
  FROM public.profiles p WHERE p.id = auth.uid();

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'task_assigned',
    'New task assigned',
    COALESCE(assigner_name, 'Someone') || ' assigned you to "' || COALESCE(task_title, 'a task') || '"',
    '/projects/' || project_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_task_assigned ON public.task_assignees;
CREATE TRIGGER trg_notify_task_assigned
  AFTER INSERT ON public.task_assignees
  FOR EACH ROW EXECUTE FUNCTION notify_task_assigned();

-- 2. Notify task assignees on new comment
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
  commenter_name TEXT;
  task_title TEXT;
  project_id UUID;
  assignee RECORD;
BEGIN
  IF NEW.task_id IS NULL THEN RETURN NEW; END IF;

  SELECT p.full_name INTO commenter_name
  FROM public.profiles p WHERE p.id = NEW.user_id;

  SELECT t.title, t.project_id INTO task_title, project_id
  FROM public.tasks t WHERE t.id = NEW.task_id;

  FOR assignee IN
    SELECT user_id FROM public.task_assignees WHERE task_id = NEW.task_id AND user_id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      assignee.user_id,
      'comment_added',
      'New comment',
      COALESCE(commenter_name, 'Someone') || ' commented on "' || COALESCE(task_title, 'a task') || '"',
      '/projects/' || project_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_task_comment ON public.comments;
CREATE TRIGGER trg_notify_task_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION notify_task_comment();

-- 3. Notify assignees on task status change
CREATE OR REPLACE FUNCTION notify_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
  changer_name TEXT;
  assignee RECORD;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;

  SELECT p.full_name INTO changer_name
  FROM public.profiles p WHERE p.id = auth.uid();

  FOR assignee IN
    SELECT user_id FROM public.task_assignees WHERE task_id = NEW.id AND user_id != auth.uid()
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      assignee.user_id,
      'status_changed',
      'Task status updated',
      COALESCE(changer_name, 'Someone') || ' moved "' || NEW.title || '" to ' || REPLACE(NEW.status, '_', ' '),
      '/projects/' || NEW.project_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_task_status ON public.tasks;
CREATE TRIGGER trg_notify_task_status
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_status_change();
