SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('team_members', 'projects') ORDER BY tablename, cmd;
