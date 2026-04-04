-- Migration 012: Saved Views — users can save filter/sort/view combinations
CREATE TABLE IF NOT EXISTS public.saved_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  view_type text NOT NULL DEFAULT 'list',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own views" ON public.saved_views FOR ALL USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON public.saved_views(user_id);
