import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Project, ProjectStatus, Milestone, ProjectTemplate, ProjectDependency } from '../types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  taskCounts: Record<string, number>
  favorites: string[]
  recentProjects: string[]
  milestones: Milestone[]
  templates: ProjectTemplate[]
  projectDependencies: ProjectDependency[]
  fetchProjects: (teamId: string) => Promise<void>
  selectProject: (projectId: string) => void
  createProject: (data: { name: string; emoji?: string; description?: string; start_date: string; end_date: string }) => Promise<{ error: string | null; project?: Project }>
  updateProject: (projectId: string, data: Partial<Project>) => Promise<{ error: string | null }>
  deleteProject: (projectId: string) => Promise<{ error: string | null }>
  getProjectStatus: (projectId: string) => Promise<{ status: ProjectStatus; progress: number }>
  toggleFavorite: (projectId: string) => Promise<void>
  trackVisit: (projectId: string) => Promise<void>
  fetchFavorites: () => Promise<void>
  fetchRecentProjects: () => Promise<void>
  fetchMilestones: (projectId: string) => Promise<void>
  createMilestone: (projectId: string, name: string, targetDate?: string) => Promise<{ error: string | null }>
  updateMilestone: (id: string, data: Partial<Milestone>) => Promise<{ error: string | null }>
  deleteMilestone: (id: string) => Promise<{ error: string | null }>
  fetchTemplates: (teamId: string) => Promise<void>
  createTemplate: (data: { team_id: string; name: string; description?: string; emoji?: string; custom_statuses?: string[]; task_templates?: ProjectTemplate['task_templates'] }) => Promise<{ error: string | null }>
  deleteTemplate: (id: string) => Promise<{ error: string | null }>
  createProjectFromTemplate: (templateId: string, name: string, startDate: string, endDate: string) => Promise<{ error: string | null; project?: Project }>
  saveProjectAsTemplate: (projectId: string, templateName: string) => Promise<{ error: string | null }>
  fetchProjectDependencies: (projectId: string) => Promise<void>
  addProjectDependency: (projectId: string, dependsOnProjectId: string) => Promise<{ error: string | null }>
  removeProjectDependency: (depId: string) => Promise<{ error: string | null }>
  updateCustomStatuses: (projectId: string, statuses: string[]) => Promise<{ error: string | null }>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  taskCounts: {},
  favorites: [],
  recentProjects: [],
  milestones: [],
  templates: [],
  projectDependencies: [],

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

  toggleFavorite: async (projectId) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const isFav = get().favorites.includes(projectId)

    if (isFav) {
      await supabase
        .from('user_project_pins')
        .update({ is_favorite: false })
        .eq('user_id', userData.user.id)
        .eq('project_id', projectId)
      set((s) => ({ favorites: s.favorites.filter((id) => id !== projectId) }))
    } else {
      await supabase
        .from('user_project_pins')
        .upsert({
          user_id: userData.user.id,
          project_id: projectId,
          is_favorite: true,
        }, { onConflict: 'user_id,project_id' })
      set((s) => ({ favorites: [...s.favorites, projectId] }))
    }
  },

  trackVisit: async (projectId) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    await supabase
      .from('user_project_pins')
      .upsert({
        user_id: userData.user.id,
        project_id: projectId,
        last_visited_at: new Date().toISOString(),
      }, { onConflict: 'user_id,project_id' })

    set((s) => {
      const recent = [projectId, ...s.recentProjects.filter((id) => id !== projectId)].slice(0, 5)
      return { recentProjects: recent }
    })
  },

  fetchFavorites: async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data } = await supabase
      .from('user_project_pins')
      .select('project_id')
      .eq('user_id', userData.user.id)
      .eq('is_favorite', true)

    set({ favorites: (data || []).map((r) => r.project_id) })
  },

  fetchRecentProjects: async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data } = await supabase
      .from('user_project_pins')
      .select('project_id')
      .eq('user_id', userData.user.id)
      .not('last_visited_at', 'is', null)
      .order('last_visited_at', { ascending: false })
      .limit(5)

    set({ recentProjects: (data || []).map((r) => r.project_id) })
  },

  // ========== Milestones ==========
  fetchMilestones: async (projectId) => {
    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('position')
    set({ milestones: data || [] })
  },

  createMilestone: async (projectId, name, targetDate) => {
    const { data: existing } = await supabase
      .from('milestones')
      .select('position')
      .eq('project_id', projectId)
      .order('position', { ascending: false })
      .limit(1)
    const nextPos = (existing?.[0]?.position ?? -1) + 1

    const { data, error } = await supabase
      .from('milestones')
      .insert({
        project_id: projectId,
        name,
        target_date: targetDate || null,
        position: nextPos,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    set((s) => ({ milestones: [...s.milestones, data] }))
    return { error: null }
  },

  updateMilestone: async (id, data) => {
    const { error } = await supabase.from('milestones').update(data).eq('id', id)
    if (!error) {
      set((s) => ({
        milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...data } : m)),
      }))
    }
    return { error: error?.message ?? null }
  },

  deleteMilestone: async (id) => {
    const { error } = await supabase.from('milestones').delete().eq('id', id)
    if (!error) {
      set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }))
    }
    return { error: error?.message ?? null }
  },

  // ========== Templates ==========
  fetchTemplates: async (teamId) => {
    const { data } = await supabase
      .from('project_templates')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    set({ templates: data || [] })
  },

  createTemplate: async (templateData) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('project_templates')
      .insert({
        team_id: templateData.team_id,
        name: templateData.name,
        description: templateData.description || null,
        emoji: templateData.emoji || '📁',
        custom_statuses: templateData.custom_statuses || [],
        task_templates: templateData.task_templates || [],
        created_by: userData.user.id,
      })

    if (error) return { error: error.message }
    // Refetch
    await get().fetchTemplates(templateData.team_id)
    return { error: null }
  },

  deleteTemplate: async (id) => {
    const { error } = await supabase.from('project_templates').delete().eq('id', id)
    if (!error) {
      set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }))
    }
    return { error: error?.message ?? null }
  },

  createProjectFromTemplate: async (templateId, name, startDate, endDate) => {
    const template = get().templates.find((t) => t.id === templateId)
    if (!template) return { error: 'Template not found' }

    // Create the project
    const result = await get().createProject({
      name,
      emoji: template.emoji,
      description: template.description || undefined,
      start_date: startDate,
      end_date: endDate,
    })
    if (result.error || !result.project) return { error: result.error || 'Failed to create project' }

    // Create tasks from template
    if (template.task_templates?.length) {
      const { data: userData } = await supabase.auth.getUser()
      const tasks = template.task_templates.map((tt, i) => ({
        project_id: result.project!.id,
        title: tt.title,
        status: tt.status || 'todo',
        priority: tt.priority || 3,
        description: tt.description || null,
        start_date: startDate,
        end_date: endDate,
        position: i,
        depth: 0,
        task_type: 'project' as const,
        created_by: userData.user!.id,
      }))
      await supabase.from('tasks').insert(tasks)
    }

    // Update custom statuses if any
    if (template.custom_statuses?.length) {
      await supabase.from('projects').update({ custom_statuses: template.custom_statuses }).eq('id', result.project.id)
    }

    return { error: null, project: result.project }
  },

  saveProjectAsTemplate: async (projectId, templateName) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return { error: 'Project not found' }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, status, priority, description')
      .eq('project_id', projectId)
      .is('parent_id', null)
      .is('deleted_at', null)
      .order('position')

    const taskTemplates = (tasks || []).map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      description: t.description || undefined,
    }))

    return get().createTemplate({
      team_id: project.team_id,
      name: templateName,
      description: project.description || undefined,
      emoji: project.emoji || '📁',
      custom_statuses: project.custom_statuses || [],
      task_templates: taskTemplates,
    })
  },

  // ========== Project Dependencies ==========
  fetchProjectDependencies: async (projectId) => {
    const { data } = await supabase
      .from('project_dependencies')
      .select('*, depends_on_project:projects!project_dependencies_depends_on_project_id_fkey(*)')
      .eq('project_id', projectId)
    set({ projectDependencies: data || [] })
  },

  addProjectDependency: async (projectId, dependsOnProjectId) => {
    const { data, error } = await supabase
      .from('project_dependencies')
      .insert({ project_id: projectId, depends_on_project_id: dependsOnProjectId })
      .select('*, depends_on_project:projects!project_dependencies_depends_on_project_id_fkey(*)')
      .single()

    if (error) return { error: error.message }
    set((s) => ({ projectDependencies: [...s.projectDependencies, data] }))
    return { error: null }
  },

  removeProjectDependency: async (depId) => {
    const { error } = await supabase.from('project_dependencies').delete().eq('id', depId)
    if (!error) {
      set((s) => ({ projectDependencies: s.projectDependencies.filter((d) => d.id !== depId) }))
    }
    return { error: error?.message ?? null }
  },

  updateCustomStatuses: async (projectId, statuses) => {
    const { error } = await supabase.from('projects').update({ custom_statuses: statuses }).eq('id', projectId)
    if (!error) {
      set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? { ...p, custom_statuses: statuses } : p)),
        currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, custom_statuses: statuses } : s.currentProject,
      }))
    }
    return { error: error?.message ?? null }
  },
}))
