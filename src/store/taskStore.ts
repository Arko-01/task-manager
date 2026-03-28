import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus, TaskPriority, TaskAssignee, Comment } from '../types'

interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  search?: string
  responsibility?: 'primary' | 'secondary' | 'all'
}

interface TaskState {
  tasks: Task[]
  currentTask: Task | null
  comments: Comment[]
  filters: TaskFilters
  loading: boolean
  fetchTasks: (projectId: string) => Promise<void>
  fetchMyTasks: () => Promise<void>
  fetchTeamTasks: (teamId: string) => Promise<void>
  createTask: (data: {
    project_id: string; title: string; start_date: string; end_date: string;
    parent_id?: string; status?: TaskStatus; priority?: TaskPriority; description?: string;
  }) => Promise<{ error: string | null; task?: Task }>
  updateTask: (taskId: string, data: Partial<Task>) => Promise<{ error: string | null }>
  deleteTask: (taskId: string) => Promise<{ error: string | null }>
  restoreTask: (taskId: string) => Promise<{ error: string | null }>
  duplicateTask: (taskId: string) => Promise<{ error: string | null }>
  moveTask: (taskId: string, status: TaskStatus, position: number) => Promise<{ error: string | null }>
  addAssignee: (taskId: string, userId: string, role: 'primary' | 'secondary') => Promise<{ error: string | null }>
  removeAssignee: (taskId: string, userId: string) => Promise<{ error: string | null }>
  updateAssigneeRole: (taskId: string, userId: string, role: 'primary' | 'secondary') => Promise<{ error: string | null }>
  addDependency: (taskId: string, dependsOnTaskId: string) => Promise<{ error: string | null }>
  removeDependency: (depId: string) => Promise<{ error: string | null }>
  fetchComments: (taskId: string) => Promise<void>
  addComment: (taskId: string, content: string) => Promise<{ error: string | null }>
  deleteComment: (commentId: string) => Promise<{ error: string | null }>
  setFilters: (filters: TaskFilters) => void
  setCurrentTask: (task: Task | null) => void
}

async function loadTaskRelations(tasks: Task[]): Promise<Task[]> {
  if (!tasks.length) return tasks
  const taskIds = tasks.map((t) => t.id)

  const [{ data: assignees }, { data: deps }] = await Promise.all([
    supabase.from('task_assignees').select('*, profile:profiles(*)').in('task_id', taskIds),
    supabase.from('task_dependencies').select('*, depends_on_task:tasks(id, title, status)').in('task_id', taskIds),
  ])

  return tasks.map((t) => ({
    ...t,
    assignees: (assignees || []).filter((a) => a.task_id === t.id) as TaskAssignee[],
    dependencies: (deps || []).filter((d) => d.task_id === t.id),
    sub_tasks: tasks.filter((st) => st.parent_id === t.id),
  }))
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  comments: [],
  filters: {},
  loading: false,

  fetchTasks: async (projectId) => {
    set({ loading: true })
    let query = supabase
      .from('tasks')
      .select('*, project:projects(id, name, emoji, team_id, start_date, end_date)')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('position')

    const { filters } = get()
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.search) query = query.ilike('title', `%${filters.search}%`)

    const { data } = await query
    const tasks = await loadTaskRelations(data || [])

    if (filters.assignee_id) {
      const filtered = tasks.filter((t) =>
        t.assignees?.some((a) => a.user_id === filters.assignee_id)
      )
      set({ tasks: filtered, loading: false })
    } else {
      set({ tasks, loading: false })
    }
  },

  fetchMyTasks: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    const { data: assigned } = await supabase
      .from('task_assignees')
      .select('task_id, role')
      .eq('user_id', user.id)

    if (!assigned?.length) { set({ tasks: [], loading: false }); return }

    const { filters } = get()
    const taskIds = filters.responsibility && filters.responsibility !== 'all'
      ? assigned.filter((a) => a.role === filters.responsibility).map((a) => a.task_id)
      : assigned.map((a) => a.task_id)

    if (!taskIds.length) { set({ tasks: [], loading: false }); return }

    let query = supabase
      .from('tasks')
      .select('*, project:projects(id, name, emoji, team_id, start_date, end_date)')
      .in('id', taskIds)
      .is('deleted_at', null)
      .order('end_date')

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.search) query = query.ilike('title', `%${filters.search}%`)

    const { data } = await query
    const tasks = await loadTaskRelations(data || [])
    set({ tasks, loading: false })
  },

  fetchTeamTasks: async (teamId) => {
    set({ loading: true })
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('team_id', teamId)

    if (!projects?.length) { set({ tasks: [], loading: false }); return }

    const projectIds = projects.map((p) => p.id)
    let query = supabase
      .from('tasks')
      .select('*, project:projects(id, name, emoji, team_id, start_date, end_date)')
      .in('project_id', projectIds)
      .is('deleted_at', null)
      .order('end_date')

    const { filters } = get()
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.search) query = query.ilike('title', `%${filters.search}%`)

    const { data } = await query
    let tasks = await loadTaskRelations(data || [])

    if (filters.assignee_id) {
      tasks = tasks.filter((t) => t.assignees?.some((a) => a.user_id === filters.assignee_id))
    }

    set({ tasks, loading: false })
  },

  createTask: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Calculate depth
    let depth = 0
    if (data.parent_id) {
      const parent = get().tasks.find((t) => t.id === data.parent_id)
      if (parent) depth = parent.depth + 1
      if (depth > 2) return { error: 'Maximum nesting depth (2 levels) reached' }
    }

    // Get max position
    const siblings = get().tasks.filter(
      (t) => t.project_id === data.project_id && t.parent_id === (data.parent_id || null) && t.status === (data.status || 'todo')
    )
    const position = siblings.length ? Math.max(...siblings.map((t) => t.position)) + 1 : 0

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        project_id: data.project_id,
        parent_id: data.parent_id || null,
        title: data.title,
        description: data.description || null,
        status: data.status || 'todo',
        priority: data.priority || 3,
        start_date: data.start_date,
        end_date: data.end_date,
        position,
        depth,
        created_by: user.id,
      })
      .select('*, project:projects(id, name, emoji, team_id, start_date, end_date)')
      .single()

    if (error) return { error: error.message }

    // Auto-assign creator as primary
    await supabase.from('task_assignees').insert({
      task_id: task.id, user_id: user.id, role: 'primary',
    })

    const enriched = (await loadTaskRelations([task]))[0]
    set((s) => ({ tasks: [...s.tasks, enriched] }))
    return { error: null, task: enriched }
  },

  updateTask: async (taskId, data) => {
    const { error } = await supabase.from('tasks').update(data).eq('id', taskId)
    if (!error) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
        currentTask: s.currentTask?.id === taskId ? { ...s.currentTask, ...data } : s.currentTask,
      }))
    }
    return { error: error?.message ?? null }
  },

  deleteTask: async (taskId) => {
    const now = new Date().toISOString()
    const { error } = await supabase.from('tasks').update({ deleted_at: now }).eq('id', taskId)
    if (!error) {
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== taskId),
        currentTask: s.currentTask?.id === taskId ? null : s.currentTask,
      }))
    }
    return { error: error?.message ?? null }
  },

  restoreTask: async (taskId) => {
    const { error } = await supabase.from('tasks').update({ deleted_at: null }).eq('id', taskId)
    return { error: error?.message ?? null }
  },

  duplicateTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task) return { error: 'Task not found' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        project_id: task.project_id,
        parent_id: task.parent_id,
        title: `${task.title} (copy)`,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        start_date: task.start_date,
        end_date: task.end_date,
        position: task.position + 1,
        depth: task.depth,
        created_by: user.id,
      })
      .select('*, project:projects(id, name, emoji, team_id, start_date, end_date)')
      .single()

    if (error) return { error: error.message }

    // Copy assignees
    if (task.assignees?.length) {
      await supabase.from('task_assignees').insert(
        task.assignees.map((a) => ({ task_id: newTask.id, user_id: a.user_id, role: a.role }))
      )
    }

    const enriched = (await loadTaskRelations([newTask]))[0]
    set((s) => ({ tasks: [...s.tasks, enriched] }))
    return { error: null }
  },

  moveTask: async (taskId, status, position) => {
    const { error } = await supabase.from('tasks').update({ status, position }).eq('id', taskId)
    if (!error) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status, position } : t)),
      }))
    }
    return { error: error?.message ?? null }
  },

  addAssignee: async (taskId, userId, role) => {
    const { error } = await supabase.from('task_assignees').insert({ task_id: taskId, user_id: userId, role })
    if (error) return { error: error.message }
    // Refetch assignees for this task
    const { data } = await supabase.from('task_assignees').select('*, profile:profiles(*)').eq('task_id', taskId)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, assignees: data as TaskAssignee[] } : t)),
      currentTask: s.currentTask?.id === taskId ? { ...s.currentTask, assignees: data as TaskAssignee[] } : s.currentTask,
    }))
    return { error: null }
  },

  removeAssignee: async (taskId, userId) => {
    const { error } = await supabase.from('task_assignees').delete().eq('task_id', taskId).eq('user_id', userId)
    if (!error) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, assignees: t.assignees?.filter((a) => a.user_id !== userId) } : t)),
        currentTask: s.currentTask?.id === taskId ? { ...s.currentTask, assignees: s.currentTask.assignees?.filter((a) => a.user_id !== userId) } : s.currentTask,
      }))
    }
    return { error: error?.message ?? null }
  },

  updateAssigneeRole: async (taskId, userId, role) => {
    const { error } = await supabase.from('task_assignees').update({ role }).eq('task_id', taskId).eq('user_id', userId)
    if (!error) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? {
          ...t, assignees: t.assignees?.map((a) => (a.user_id === userId ? { ...a, role } : a)),
        } : t)),
      }))
    }
    return { error: error?.message ?? null }
  },

  addDependency: async (taskId, dependsOnTaskId) => {
    const { error } = await supabase.from('task_dependencies').insert({
      task_id: taskId, depends_on_task_id: dependsOnTaskId, type: 'blocked_by',
    })
    return { error: error?.message ?? null }
  },

  removeDependency: async (depId) => {
    const { error } = await supabase.from('task_dependencies').delete().eq('id', depId)
    return { error: error?.message ?? null }
  },

  fetchComments: async (taskId) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles(*)')
      .eq('task_id', taskId)
      .order('created_at')
    set({ comments: (data as Comment[]) || [] })
  },

  addComment: async (taskId, content) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: user.id, content })
      .select('*, profile:profiles(*)')
      .single()

    if (!error && data) {
      set((s) => ({ comments: [...s.comments, data as Comment] }))
    }
    return { error: error?.message ?? null }
  },

  deleteComment: async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (!error) set((s) => ({ comments: s.comments.filter((c) => c.id !== commentId) }))
    return { error: error?.message ?? null }
  },

  setFilters: (filters) => set({ filters }),
  setCurrentTask: (task) => set({ currentTask: task }),
}))
