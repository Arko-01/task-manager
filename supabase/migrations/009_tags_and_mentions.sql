-- Add tags support to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Index for tag filtering
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON public.tasks USING GIN (tags);

-- Team-level tag suggestions (tracks all used tags per team)
CREATE TABLE IF NOT EXISTS public.team_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, name)
);

ALTER TABLE public.team_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view tags"
  ON public.team_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_tags.team_id AND tm.user_id = auth.uid()
  ));

CREATE POLICY "Team members can insert tags"
  ON public.team_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_tags.team_id AND tm.user_id = auth.uid()
  ));

-- Add mentions support to comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS mentions uuid[] DEFAULT '{}';
