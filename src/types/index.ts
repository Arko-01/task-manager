// ============ Auth & Profile ============
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  timezone: string | null
  created_at: string
}

// ============ Teams ============
export interface Team {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
}

export type TeamRole = 'admin' | 'sub_team_manager' | 'member' | 'viewer'

export interface TeamPermissions {
  view_tasks: boolean
  create_tasks: boolean
  edit_own_tasks: boolean
  edit_all_tasks: boolean
  delete_tasks: boolean
  manage_projects: boolean
  manage_sub_teams: boolean
  invite_members: boolean
  remove_members: boolean
  manage_roles: boolean
  view_admin_panel: boolean
  full_access: boolean
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  permissions: TeamPermissions
  joined_at: string
  profile?: Profile
}

// ============ Sub-Teams ============
export interface SubTeam {
  id: string
  team_id: string
  name: string
  manager_id: string
  created_at: string
  manager?: Profile
  members?: SubTeamMember[]
}

export interface SubTeamMember {
  sub_team_id: string
  user_id: string
  profile?: Profile
}

// ============ Projects ============
export interface Project {
  id: string
  team_id: string
  name: string
  emoji: string | null
  description: string | null
  is_default: boolean
  start_date: string
  end_date: string
  created_by: string
  created_at: string
}

export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'overdue'

// ============ Tasks ============
export type TaskStatus = 'todo' | 'in_progress' | 'on_hold' | 'done'
export type TaskPriority = 1 | 2 | 3 | 4 // 1=urgent, 2=high, 3=medium, 4=low

export interface Task {
  id: string
  project_id: string
  parent_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  start_date: string
  end_date: string
  position: number
  depth: number
  is_recurring: boolean
  recurrence_pattern: RecurrencePattern | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined data
  assignees?: TaskAssignee[]
  sub_tasks?: Task[]
  dependencies?: TaskDependency[]
  project?: Project
}

export type AssigneeRole = 'primary' | 'secondary'

export interface TaskAssignee {
  task_id: string
  user_id: string
  role: AssigneeRole
  profile?: Profile
}

export interface TaskDependency {
  id: string
  task_id: string
  depends_on_task_id: string
  type: 'blocks' | 'blocked_by'
  depends_on_task?: Task
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval: number
  days_of_week?: number[]
  day_of_month?: number
  end_date?: string
}

// ============ Comments ============
export interface Comment {
  id: string
  task_id: string | null
  project_id: string | null
  user_id: string
  content: string
  created_at: string
  profile?: Profile
}

// ============ Chat ============
export type ConversationType = 'direct' | 'team' | 'group'

export interface Conversation {
  id: string
  type: ConversationType
  team_id: string
  name: string | null
  created_by: string
  created_at: string
  members?: ConversationMember[]
  last_message?: Message
  unread_count?: number
}

export interface ConversationMember {
  conversation_id: string
  user_id: string
  profile?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
  reads?: MessageRead[]
}

export interface MessageRead {
  message_id: string
  user_id: string
  read_at: string
}

// ============ Notifications ============
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationPreferences {
  user_id: string
  preferences: Record<string, { in_app: boolean; push: boolean }>
  quiet_hours_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

// ============ View Types ============
export type ViewType = 'list' | 'board' | 'calendar' | 'gantt'

// ============ Priority & Status Helpers ============
export const PRIORITY_CONFIG = {
  1: { label: 'Urgent', color: 'red', dotClass: 'bg-red-500' },
  2: { label: 'High', color: 'orange', dotClass: 'bg-orange-500' },
  3: { label: 'Medium', color: 'yellow', dotClass: 'bg-yellow-500' },
  4: { label: 'Low', color: 'gray', dotClass: 'bg-gray-400' },
} as const

export const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'gray', badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'In Progress', color: 'blue', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  on_hold: { label: 'On Hold', color: 'amber', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  done: { label: 'Done', color: 'green', badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
} as const

export const DEFAULT_PERMISSIONS: TeamPermissions = {
  view_tasks: true,
  create_tasks: true,
  edit_own_tasks: true,
  edit_all_tasks: false,
  delete_tasks: false,
  manage_projects: false,
  manage_sub_teams: false,
  invite_members: false,
  remove_members: false,
  manage_roles: false,
  view_admin_panel: false,
  full_access: false,
}
