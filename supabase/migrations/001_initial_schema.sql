-- ============================================================
-- Team Task Manager — Initial Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============ Profiles ============
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ Teams ============
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============ Team Members ============
create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'sub_team_manager', 'member', 'viewer')) default 'member',
  permissions jsonb default '{
    "view_tasks": true,
    "create_tasks": true,
    "edit_own_tasks": true,
    "edit_all_tasks": false,
    "delete_tasks": false,
    "manage_projects": false,
    "manage_sub_teams": false,
    "invite_members": false,
    "remove_members": false,
    "manage_roles": false,
    "view_admin_panel": false,
    "full_access": false
  }'::jsonb,
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

-- ============ Sub-Teams ============
create table public.sub_teams (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  name text not null,
  manager_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.sub_team_members (
  sub_team_id uuid references public.sub_teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  primary key (sub_team_id, user_id)
);

-- ============ Projects ============
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  name text not null,
  emoji text default '📋',
  description text,
  is_default boolean default false,
  start_date date not null,
  end_date date not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  check (end_date >= start_date)
);

-- ============ Tasks ============
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  parent_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'on_hold', 'done')) default 'todo',
  priority integer check (priority between 1 and 4) default 3,
  start_date date not null,
  end_date date not null,
  position integer default 0,
  depth integer check (depth between 0 and 2) default 0,
  is_recurring boolean default false,
  recurrence_pattern jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  check (end_date >= start_date)
);

-- Auto-update updated_at
create or replace function public.update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.update_modified_column();

-- ============ Task Assignees ============
create table public.task_assignees (
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('primary', 'secondary')) default 'primary',
  primary key (task_id, user_id)
);

-- ============ Task Dependencies ============
create table public.task_dependencies (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  depends_on_task_id uuid references public.tasks(id) on delete cascade not null,
  type text check (type in ('blocks', 'blocked_by')) not null,
  unique(task_id, depends_on_task_id)
);

-- ============ Comments ============
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now(),
  check (task_id is not null or project_id is not null)
);

-- ============ Chat ============
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  type text check (type in ('direct', 'team', 'group')) not null,
  team_id uuid references public.teams(id) on delete cascade not null,
  name text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);

create table public.message_reads (
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  read_at timestamptz default now(),
  primary key (message_id, user_id)
);

-- ============ Notifications ============
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table public.notification_preferences (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  preferences jsonb default '{
    "task_assigned": { "in_app": true, "push": true },
    "task_status_changed": { "in_app": true, "push": false },
    "task_overdue": { "in_app": true, "push": true },
    "due_date_approaching": { "in_app": true, "push": true },
    "comment_added": { "in_app": true, "push": false },
    "mention": { "in_app": true, "push": true },
    "direct_message": { "in_app": true, "push": true },
    "team_chat": { "in_app": true, "push": false },
    "group_chat": { "in_app": true, "push": false }
  }'::jsonb,
  quiet_hours_enabled boolean default false,
  quiet_hours_start time,
  quiet_hours_end time
);

-- ============ Indexes ============
create index idx_team_members_user on public.team_members(user_id);
create index idx_team_members_team on public.team_members(team_id);
create index idx_sub_team_members_sub on public.sub_team_members(sub_team_id);
create index idx_sub_team_members_user on public.sub_team_members(user_id);
create index idx_projects_team on public.projects(team_id);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_parent on public.tasks(parent_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_deleted on public.tasks(deleted_at);
create index idx_task_assignees_user on public.task_assignees(user_id);
create index idx_comments_task on public.comments(task_id);
create index idx_comments_project on public.comments(project_id);
create index idx_messages_conversation on public.messages(conversation_id);
create index idx_messages_created on public.messages(created_at);
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_read on public.notifications(is_read);

-- ============ RLS Policies ============

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.sub_teams enable row level security;
alter table public.sub_team_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

-- Helper: is current user a member of this team?
create or replace function public.is_team_member(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: is current user admin of team?
create or replace function public.is_team_admin(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (id = auth.uid());

-- Teams
create policy "teams_select" on public.teams for select using (public.is_team_member(id));
create policy "teams_insert" on public.teams for insert with check (auth.uid() is not null);
create policy "teams_update" on public.teams for update using (public.is_team_admin(id));

-- Team Members
create policy "team_members_select" on public.team_members for select using (public.is_team_member(team_id));
create policy "team_members_insert" on public.team_members for insert with check (
  public.is_team_admin(team_id) or user_id = auth.uid()
);
create policy "team_members_delete" on public.team_members for delete using (public.is_team_admin(team_id));
create policy "team_members_update" on public.team_members for update using (public.is_team_admin(team_id));

-- Sub-Teams
create policy "sub_teams_select" on public.sub_teams for select using (public.is_team_member(team_id));
create policy "sub_teams_insert" on public.sub_teams for insert with check (public.is_team_admin(team_id));
create policy "sub_teams_update" on public.sub_teams for update using (public.is_team_admin(team_id));
create policy "sub_teams_delete" on public.sub_teams for delete using (public.is_team_admin(team_id));

-- Sub-Team Members
create policy "sub_team_members_select" on public.sub_team_members for select using (
  exists (select 1 from public.sub_teams st where st.id = sub_team_id and public.is_team_member(st.team_id))
);
create policy "sub_team_members_insert" on public.sub_team_members for insert with check (
  exists (select 1 from public.sub_teams st where st.id = sub_team_id and public.is_team_admin(st.team_id))
);
create policy "sub_team_members_delete" on public.sub_team_members for delete using (
  exists (select 1 from public.sub_teams st where st.id = sub_team_id and public.is_team_admin(st.team_id))
);

-- Projects
create policy "projects_select" on public.projects for select using (public.is_team_member(team_id));
create policy "projects_insert" on public.projects for insert with check (public.is_team_member(team_id));
create policy "projects_update" on public.projects for update using (public.is_team_member(team_id));
create policy "projects_delete" on public.projects for delete using (
  public.is_team_admin(team_id) and is_default = false
);

-- Tasks (accessed through project's team)
create policy "tasks_select" on public.tasks for select using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_team_member(p.team_id))
);
create policy "tasks_insert" on public.tasks for insert with check (
  exists (select 1 from public.projects p where p.id = project_id and public.is_team_member(p.team_id))
);
create policy "tasks_update" on public.tasks for update using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_team_member(p.team_id))
);
create policy "tasks_delete" on public.tasks for delete using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_team_member(p.team_id))
);

-- Task Assignees
create policy "task_assignees_select" on public.task_assignees for select using (
  exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = task_id and public.is_team_member(p.team_id)
  )
);
create policy "task_assignees_insert" on public.task_assignees for insert with check (
  exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = task_id and public.is_team_member(p.team_id)
  )
);
create policy "task_assignees_delete" on public.task_assignees for delete using (
  exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = task_id and public.is_team_member(p.team_id)
  )
);

-- Task Dependencies
create policy "task_deps_select" on public.task_dependencies for select using (
  exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = task_id and public.is_team_member(p.team_id)
  )
);
create policy "task_deps_insert" on public.task_dependencies for insert with check (
  exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = task_id and public.is_team_member(p.team_id)
  )
);
create policy "task_deps_delete" on public.task_dependencies for delete using (
  exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = task_id and public.is_team_member(p.team_id)
  )
);

-- Comments
create policy "comments_select" on public.comments for select using (
  (task_id is not null and exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = task_id and public.is_team_member(p.team_id)
  )) or
  (project_id is not null and exists (
    select 1 from public.projects p where p.id = project_id and public.is_team_member(p.team_id)
  ))
);
create policy "comments_insert" on public.comments for insert with check (user_id = auth.uid());
create policy "comments_delete" on public.comments for delete using (user_id = auth.uid());

-- Conversations
create policy "conversations_select" on public.conversations for select using (
  exists (select 1 from public.conversation_members where conversation_id = id and user_id = auth.uid())
);
create policy "conversations_insert" on public.conversations for insert with check (public.is_team_member(team_id));

-- Conversation Members
create policy "conv_members_select" on public.conversation_members for select using (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid())
);
create policy "conv_members_insert" on public.conversation_members for insert with check (
  exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid())
  or user_id = auth.uid()
);

-- Messages
create policy "messages_select" on public.messages for select using (
  exists (select 1 from public.conversation_members where conversation_id = messages.conversation_id and user_id = auth.uid())
);
create policy "messages_insert" on public.messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversation_members where conversation_id = messages.conversation_id and user_id = auth.uid()
  )
);

-- Message Reads
create policy "message_reads_select" on public.message_reads for select using (user_id = auth.uid());
create policy "message_reads_insert" on public.message_reads for insert with check (user_id = auth.uid());

-- Notifications
create policy "notifications_select" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_update" on public.notifications for update using (user_id = auth.uid());

-- Notification Preferences
create policy "notif_prefs_select" on public.notification_preferences for select using (user_id = auth.uid());
create policy "notif_prefs_insert" on public.notification_preferences for insert with check (user_id = auth.uid());
create policy "notif_prefs_update" on public.notification_preferences for update using (user_id = auth.uid());

-- ============ Enable Realtime ============
-- Enable realtime for chat messages and notifications
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
