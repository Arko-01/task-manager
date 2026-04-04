-- Migration 010: Enhancement Checklist v1.3 — Schema additions
-- Covers: task types, time tracking, custom statuses, milestones, project templates,
-- project dependencies, activity logs, audit logs, favorites, FTS, extended roles, etc.

-- ============================================================
-- A3: Task types/categories
-- ============================================================
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'ad_hoc';
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN ('ad_hoc', 'project', 'recurring', 'system', 'subtask'));
CREATE INDEX IF NOT EXISTS idx_tasks_type ON public.tasks(task_type);

-- ============================================================
-- A3: Time tracking
-- ============================================================
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS time_spent_days numeric(6,2) DEFAULT 0;

-- ============================================================
-- A3: Custom statuses per project
-- ============================================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS custom_statuses jsonb
  DEFAULT '["todo","in_progress","on_hold","done"]'::jsonb;

-- ============================================================
-- A4: Task subscription notification level
-- ============================================================
ALTER TABLE public.task_assignees ADD COLUMN IF NOT EXISTS notification_level text DEFAULT 'all';
ALTER TABLE public.task_assignees DROP CONSTRAINT IF EXISTS task_assignees_notification_level_check;
ALTER TABLE public.task_assignees ADD CONSTRAINT task_assignees_notification_level_check
  CHECK (notification_level IN ('all', 'mentions', 'none'));

-- ============================================================
-- B1: Project folders / hierarchy
-- ============================================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS parent_project_id uuid
  REFERENCES public.projects(id) ON DELETE SET NULL;

-- ============================================================
-- B1: Milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  target_date date,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view milestones" ON public.milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.team_members tm ON tm.team_id = p.team_id
    WHERE p.id = milestones.project_id AND tm.user_id = auth.uid()
  ));
CREATE POLICY "Team members can manage milestones" ON public.milestones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.team_members tm ON tm.team_id = p.team_id
    WHERE p.id = milestones.project_id AND tm.user_id = auth.uid()
  ));

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS milestone_id uuid
  REFERENCES public.milestones(id) ON DELETE SET NULL;

-- ============================================================
-- B1: Project templates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  emoji text DEFAULT '📋',
  custom_statuses jsonb DEFAULT '["todo","in_progress","on_hold","done"]'::jsonb,
  task_templates jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view templates" ON public.project_templates FOR SELECT
  USING (public.is_team_member(team_id));
CREATE POLICY "Team members can create templates" ON public.project_templates FOR INSERT
  WITH CHECK (public.is_team_member(team_id));
CREATE POLICY "Admins can manage templates" ON public.project_templates
  FOR ALL USING (public.is_team_admin(team_id));

-- ============================================================
-- B1: Project dependencies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_dependencies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  depends_on_project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, depends_on_project_id)
);
ALTER TABLE public.project_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view project deps" ON public.project_dependencies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.team_members tm ON tm.team_id = p.team_id
    WHERE p.id = project_dependencies.project_id AND tm.user_id = auth.uid()
  ));
CREATE POLICY "Team members can manage project deps" ON public.project_dependencies
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.team_members tm ON tm.team_id = p.team_id
    WHERE p.id = project_dependencies.project_id AND tm.user_id = auth.uid()
  ));

-- ============================================================
-- B2: Extended team roles
-- ============================================================
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
-- Now supports: admin, sub_team_manager, project_lead, task_lead, member, viewer

-- ============================================================
-- B2: Team member profile extensions
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- ============================================================
-- B3: Activity log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_title text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_activity_team_created ON public.activity_log(team_id, created_at DESC);

CREATE POLICY "Team members can view activity" ON public.activity_log FOR SELECT
  USING (public.is_team_member(team_id));

-- Activity log trigger for task changes
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team_id uuid;
  v_user_name text;
BEGIN
  SELECT p.team_id INTO v_team_id FROM public.projects p WHERE p.id = NEW.project_id;
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (team_id, user_id, action, entity_type, entity_id, entity_title, metadata)
    VALUES (v_team_id, auth.uid(), 'created', 'task', NEW.id, NEW.title,
      jsonb_build_object('status', NEW.status, 'priority', NEW.priority));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.activity_log (team_id, user_id, action, entity_type, entity_id, entity_title, metadata)
      VALUES (v_team_id, auth.uid(), 'status_changed', 'task', NEW.id, NEW.title,
        jsonb_build_object('from', OLD.status, 'to', NEW.status));
    END IF;
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      INSERT INTO public.activity_log (team_id, user_id, action, entity_type, entity_id, entity_title, metadata)
      VALUES (v_team_id, auth.uid(), 'deleted', 'task', NEW.id, NEW.title, '{}'::jsonb);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_activity_trigger ON public.tasks;
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_activity();

-- ============================================================
-- B3: Scheduled messages
-- ============================================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_sent boolean DEFAULT true;

-- ============================================================
-- B5: Calendar export token
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ical_token uuid DEFAULT gen_random_uuid();

-- ============================================================
-- D3: Custom workspace colors + icon
-- ============================================================
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#6366f1';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_url text;

-- ============================================================
-- D4: Audit logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_team_created ON public.audit_logs(team_id, created_at DESC);

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT
  USING (public.is_team_admin(team_id));

-- ============================================================
-- A2: Favorites / recent projects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_project_pins (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  is_favorite boolean DEFAULT false,
  last_visited_at timestamptz DEFAULT now(),
  PRIMARY KEY(user_id, project_id)
);
ALTER TABLE public.user_project_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pins" ON public.user_project_pins
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- E: Full-text search indexing
-- ============================================================
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))) STORED;
CREATE INDEX IF NOT EXISTS idx_tasks_fts ON public.tasks USING GIN (fts);

-- ============================================================
-- E: Missing indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON public.tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON public.task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, status) WHERE deleted_at IS NULL;

-- ============================================================
-- E: Archive support
-- ============================================================
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON public.tasks(archived_at) WHERE archived_at IS NOT NULL;
