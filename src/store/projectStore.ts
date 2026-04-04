import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Project, ProjectStatus } from '../types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  taskCounts: Record<string, number>
  fetchProjects: (teamId: string) => Promise<void>
  selectProject: (projectId: string) => void
  createProject: (data: { name: string; emoji?: string; description?: string; start_date: string; end_date: string }) => Promise<{ error: string | null; project?: Project }>
  updateProject: (projectId: string, data: Partial<Project>) => Promise<{ error: string | null }>
  deleteProject: (projectId: string) => Promise<{ error: string | null }>
  getProjectStatus: (projectId: string) => Promise<{ status: ProjectStatus; progress: number }>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  taskCounts: {},

  fetchProjects: async (teamId) => {
    set({ loading: true })
    const [{ data }, { data: counts }] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .order('is_default', { ascending: false })
        .order('created_at'),
      supabase
        .from('tasks')
        .select('project_id')
        .is('deleted_at', null)
        .is('parent_id', null),
    ])
    const taskCounts: Record<string, number> = {}
    for (const t of counts || []) {
      taskCounts[t.project_id] = (taskCounts[t.project_id] || 0) + 1
    }
    set({ projects: data || [], taskCounts, loading: false })
  },

  selectProject: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    set({ currentProject: project || null })
  },

  createProject: async (data) => {
    const { data: teamData } = await supabase.auth.getUser()
    if (!teamData.user) return { error: 'Not authenticated' }

    const teamStore = (await import('./teamStore')).useTeamStore.getState()
    const team = teamStore.currentTeam
    if (!team) return { error: 'No team selected' }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        team_id: team.id,
        name: data.name,
        emoji: data.emoji || '📁',
        description: data.description || null,
        start_date: data.start_date,
        end_date: data.end_date,
        is_default: false,
        created_by: teamData.user.id,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    set((s) => ({ projects: [...s.projects, project] }))
    return { error: null, project }
  },

  updateProject: async (projectId, data) => {
    const { error } = await supabase.from('projects').update(data).eq('id', projectId)
    if (!error) {
      set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...data } : p)),
        currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, ...data } : s.currentProject,
      }))
    }
    return { error: error?.message ?? null }
  },

  deleteProject: async (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (project?.is_default) return { error: 'Cannot delete the default project' }

    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (!error) {
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== projectId),
        currentProject: s.currentProject?.id === projectId ? null : s.currentProject,
      }))
    }
    return { error: error?.message ?? null }
  },

  getProjectStatus: async (projectId) => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', projectId)
      .is('parent_id', null)
      .is('deleted_at', null)

    if (!tasks?.length) return { status: 'not_started' as ProjectStatus, progress: 0 }

    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'done').length
    const onHold = tasks.filter((t) => t.status === 'on_hold').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const progress = Math.round((done / total) * 100)

    const project = get().projects.find((p) => p.id === projectId)
    const isOverdue = project && new Date(project.end_date) < new Date() && done < total

    let status: ProjectStatus = 'not_started'
    if (isOverdue) status = 'overdue'
    else if (done === total) status = 'completed'
    else if (onHold === total - done && done === 0) status = 'on_hold'
    else if (inProgress > 0 || done > 0) status = 'in_progress'

    return { status, progress }
  },
}))
