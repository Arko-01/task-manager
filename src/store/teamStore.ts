import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Team, TeamMember, SubTeam } from '../types'

interface TeamState {
  teams: Team[]
  currentTeam: Team | null
  members: TeamMember[]
  subTeams: SubTeam[]
  loading: boolean
  fetchTeams: () => Promise<void>
  selectTeam: (teamId: string) => Promise<void>
  createTeam: (name: string, description?: string) => Promise<{ error: string | null; team?: Team }>
  updateTeam: (teamId: string, data: Partial<Team>) => Promise<{ error: string | null }>
  inviteMember: (email: string) => Promise<{ error: string | null }>
  removeMember: (userId: string) => Promise<{ error: string | null }>
  updateMemberRole: (memberId: string, role: string, permissions?: object) => Promise<{ error: string | null }>
  fetchMembers: (teamId: string) => Promise<void>
  fetchSubTeams: (teamId: string) => Promise<void>
  createSubTeam: (name: string, managerId?: string) => Promise<{ error: string | null }>
  updateSubTeam: (subTeamId: string, data: Partial<SubTeam>) => Promise<{ error: string | null }>
  deleteSubTeam: (subTeamId: string) => Promise<{ error: string | null }>
  addSubTeamMember: (subTeamId: string, userId: string) => Promise<{ error: string | null }>
  removeSubTeamMember: (subTeamId: string, userId: string) => Promise<{ error: string | null }>
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  currentTeam: null,
  members: [],
  subTeams: [],
  loading: false,

  fetchTeams: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    const { data: memberRows } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    if (!memberRows?.length) { set({ teams: [], loading: false }); return }

    const teamIds = memberRows.map((r) => r.team_id)
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds)
      .order('created_at')

    set({ teams: teams || [], loading: false })

    // Auto-select first team if none selected
    if (!get().currentTeam && teams?.length) {
      await get().selectTeam(teams[0].id)
    }
  },

  selectTeam: async (teamId) => {
    const team = get().teams.find((t) => t.id === teamId)
    if (team) {
      set({ currentTeam: team })
      localStorage.setItem('currentTeamId', teamId)
      await Promise.all([get().fetchMembers(teamId), get().fetchSubTeams(teamId)])
    }
  },

  createTeam: async (name, description) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: team, error } = await supabase
      .from('teams')
      .insert({ name, description: description || null, created_by: user.id })
      .select()
      .single()

    if (error) return { error: error.message }

    // Add creator as admin
    const adminPermissions = {
      view_tasks: true, create_tasks: true, edit_own_tasks: true, edit_all_tasks: true,
      delete_tasks: true, manage_projects: true, manage_sub_teams: true,
      invite_members: true, remove_members: true, manage_roles: true,
      view_admin_panel: true, full_access: true,
    }

    await supabase.from('team_members').insert({
      team_id: team.id, user_id: user.id, role: 'admin', permissions: adminPermissions,
    })

    // Create default "General" project
    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await supabase.from('projects').insert({
      team_id: team.id, name: 'General', emoji: '📋', is_default: true,
      start_date: today, end_date: endDate, created_by: user.id,
    })

    set((s) => ({ teams: [...s.teams, team] }))
    await get().selectTeam(team.id)
    return { error: null, team }
  },

  updateTeam: async (teamId, data) => {
    const { error } = await supabase.from('teams').update(data).eq('id', teamId)
    if (!error) {
      set((s) => ({
        teams: s.teams.map((t) => (t.id === teamId ? { ...t, ...data } : t)),
        currentTeam: s.currentTeam?.id === teamId ? { ...s.currentTeam, ...data } : s.currentTeam,
      }))
    }
    return { error: error?.message ?? null }
  },

  fetchMembers: async (teamId) => {
    const { data } = await supabase
      .from('team_members')
      .select('*, profile:profiles(*)')
      .eq('team_id', teamId)
      .order('joined_at')
    set({ members: (data as TeamMember[]) || [] })
  },

  inviteMember: async (email) => {
    const team = get().currentTeam
    if (!team) return { error: 'No team selected' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profile) return { error: 'No user found with that email. They need to sign up first.' }

    const existing = get().members.find((m) => m.user_id === profile.id)
    if (existing) return { error: 'User is already a member of this team.' }

    const { error } = await supabase.from('team_members').insert({
      team_id: team.id, user_id: profile.id, role: 'member',
    })

    if (!error) await get().fetchMembers(team.id)
    return { error: error?.message ?? null }
  },

  removeMember: async (userId) => {
    const team = get().currentTeam
    if (!team) return { error: 'No team selected' }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id)
      .eq('user_id', userId)

    if (!error) {
      set((s) => ({ members: s.members.filter((m) => m.user_id !== userId) }))
    }
    return { error: error?.message ?? null }
  },

  updateMemberRole: async (memberId, role, permissions) => {
    const update: Record<string, unknown> = { role }
    if (permissions) update.permissions = permissions
    const { error } = await supabase.from('team_members').update(update).eq('id', memberId)
    if (!error) {
      set((s) => ({
        members: s.members.map((m) => (m.id === memberId ? { ...m, ...update } as TeamMember : m)),
      }))
    }
    return { error: error?.message ?? null }
  },

  fetchSubTeams: async (teamId) => {
    const { data } = await supabase
      .from('sub_teams')
      .select('*, manager:profiles!sub_teams_manager_id_fkey(*)')
      .eq('team_id', teamId)
      .order('created_at')

    // Fetch members for each sub-team
    if (data) {
      for (const st of data) {
        const { data: members } = await supabase
          .from('sub_team_members')
          .select('*, profile:profiles(*)')
          .eq('sub_team_id', st.id)
        st.members = members || []
      }
    }
    set({ subTeams: (data as SubTeam[]) || [] })
  },

  createSubTeam: async (name, managerId) => {
    const team = get().currentTeam
    if (!team) return { error: 'No team selected' }
    const { error } = await supabase.from('sub_teams').insert({
      team_id: team.id, name, manager_id: managerId || null,
    })
    if (!error) await get().fetchSubTeams(team.id)
    return { error: error?.message ?? null }
  },

  updateSubTeam: async (subTeamId, data) => {
    const { error } = await supabase.from('sub_teams').update(data).eq('id', subTeamId)
    if (!error && get().currentTeam) await get().fetchSubTeams(get().currentTeam!.id)
    return { error: error?.message ?? null }
  },

  deleteSubTeam: async (subTeamId) => {
    const { error } = await supabase.from('sub_teams').delete().eq('id', subTeamId)
    if (!error) set((s) => ({ subTeams: s.subTeams.filter((st) => st.id !== subTeamId) }))
    return { error: error?.message ?? null }
  },

  addSubTeamMember: async (subTeamId, userId) => {
    const { error } = await supabase.from('sub_team_members').insert({ sub_team_id: subTeamId, user_id: userId })
    if (!error && get().currentTeam) await get().fetchSubTeams(get().currentTeam!.id)
    return { error: error?.message ?? null }
  },

  removeSubTeamMember: async (subTeamId, userId) => {
    const { error } = await supabase.from('sub_team_members').delete()
      .eq('sub_team_id', subTeamId).eq('user_id', userId)
    if (!error && get().currentTeam) await get().fetchSubTeams(get().currentTeam!.id)
    return { error: error?.message ?? null }
  },
}))
