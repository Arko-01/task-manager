-- Fix teams SELECT policy to allow creator to read their own team immediately after creation
DROP POLICY IF EXISTS teams_select ON public.teams;
CREATE POLICY teams_select ON public.teams FOR SELECT USING (
  public.is_team_member(id) OR created_by = auth.uid()
);

-- Fix projects INSERT policy: team members should be able to create projects
-- Also fix SELECT for projects: allow team members to read
DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects FOR INSERT WITH CHECK (
  public.is_team_member(team_id)
);
