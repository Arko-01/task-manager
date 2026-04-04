import { useState, useEffect } from 'react'
import { useTeamStore } from '../store/teamStore'
import { useAuthStore } from '../store/authStore'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { Shield, Users, FolderTree, Settings, Plus, Trash2, X, Layout, ScrollText } from 'lucide-react'
import { ProjectTemplateList } from '../components/project/ProjectTemplateList'
import { AppearanceSettings } from '../components/admin/AppearanceSettings'
import { AuditLogViewer } from '../components/admin/AuditLogViewer'
import type { TeamRole, TeamPermissions } from '../types'
import { DEFAULT_PERMISSIONS, ROLE_CONFIG } from '../types'

const ROLE_PRESETS: Record<TeamRole, TeamPermissions> = {
  admin: { view_tasks: true, create_tasks: true, edit_own_tasks: true, edit_all_tasks: true, delete_tasks: true, manage_projects: true, manage_sub_teams: true, invite_members: true, remove_members: true, manage_roles: true, view_admin_panel: true, full_access: true },
  sub_team_manager: { view_tasks: true, create_tasks: true, edit_own_tasks: true, edit_all_tasks: true, delete_tasks: false, manage_projects: true, manage_sub_teams: true, invite_members: true, remove_members: false, manage_roles: false, view_admin_panel: true, full_access: false },
  project_lead: { view_tasks: true, create_tasks: true, edit_own_tasks: true, edit_all_tasks: true, delete_tasks: true, manage_projects: true, manage_sub_teams: false, invite_members: false, remove_members: false, manage_roles: false, view_admin_panel: true, full_access: false },
  task_lead: { view_tasks: true, create_tasks: true, edit_own_tasks: true, edit_all_tasks: true, delete_tasks: false, manage_projects: false, manage_sub_teams: false, invite_members: false, remove_members: false, manage_roles: false, view_admin_panel: false, full_access: false },
  member: { ...DEFAULT_PERMISSIONS },
  viewer: { view_tasks: true, create_tasks: false, edit_own_tasks: false, edit_all_tasks: false, delete_tasks: false, manage_projects: false, manage_sub_teams: false, invite_members: false, remove_members: false, manage_roles: false, view_admin_panel: false, full_access: false },
}

const PERMISSION_LABELS: Record<keyof TeamPermissions, string> = {
  view_tasks: 'View Tasks', create_tasks: 'Create Tasks', edit_own_tasks: 'Edit Own Tasks',
  edit_all_tasks: 'Edit All Tasks', delete_tasks: 'Delete Tasks', manage_projects: 'Manage Projects',
  manage_sub_teams: 'Manage Sub-Teams', invite_members: 'Invite Members', remove_members: 'Remove Members',
  manage_roles: 'Manage Roles', view_admin_panel: 'View Admin Panel', full_access: 'Full Access',
}

export function AdminPage() {
  const { currentTeam, members, subTeams, updateTeam, updateMemberRole, removeMember, createSubTeam, deleteSubTeam, addSubTeamMember, removeSubTeamMember } = useTeamStore()
  const { profile } = useAuthStore()
  const { showToast } = useToast()
  const [tab, setTab] = useState<'members' | 'subteams' | 'templates' | 'settings' | 'audit'>('members')
  const [editMemberId, setEditMemberId] = useState<string | null>(null)
  const [showNewSubTeam, setShowNewSubTeam] = useState(false)
  const [subTeamName, setSubTeamName] = useState('')
  const [teamName, setTeamName] = useState(currentTeam?.name || '')
  const [teamDesc, setTeamDesc] = useState(currentTeam?.description || '')

  useEffect(() => {
    setTeamName(currentTeam?.name || '')
    setTeamDesc(currentTeam?.description || '')
  }, [currentTeam])

  const currentMember = members.find((m) => m.user_id === profile?.id)
  const isAdmin = currentMember?.role === 'admin' || currentMember?.permissions?.full_access

  if (!currentTeam || !isAdmin) {
    return <div className="py-12 text-center text-sm text-gray-400">Access denied. Admin only.</div>
  }

  const handleRoleChange = async (memberId: string, role: TeamRole) => {
    const perms = ROLE_PRESETS[role]
    const { error } = await updateMemberRole(memberId, role, perms)
    if (error) showToast(error, 'error')
    else showToast('Role updated', 'success')
    setEditMemberId(null)
  }

  const handlePermToggle = async (memberId: string, currentPerms: TeamPermissions, key: keyof TeamPermissions) => {
    const updated = { ...currentPerms, [key]: !currentPerms[key] }
    const { error } = await updateMemberRole(memberId, 'member', updated)
    if (error) showToast(error, 'error')
  }

  const handleRemoveMember = async (userId: string) => {
    const { error } = await removeMember(userId)
    if (error) showToast(error, 'error')
    else showToast('Member removed', 'info')
  }

  const handleCreateSubTeam = async () => {
    if (!subTeamName.trim()) return
    const { error } = await createSubTeam(subTeamName.trim())
    if (error) showToast(error, 'error')
    else { showToast('Sub-team created', 'success'); setSubTeamName(''); setShowNewSubTeam(false) }
  }

  const handleSaveSettings = async () => {
    if (!teamName.trim()) return
    const { error } = await updateTeam(currentTeam.id, { name: teamName.trim(), description: teamDesc.trim() || null })
    if (error) showToast(error, 'error')
    else showToast('Settings saved', 'success')
  }

  const tabs = [
    { id: 'members' as const, label: 'Members', icon: Users },
    { id: 'subteams' as const, label: 'Sub-Teams', icon: FolderTree },
    { id: 'templates' as const, label: 'Templates', icon: Layout },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'audit' as const, label: 'Audit Log', icon: ScrollText },
  ]

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-2">
        <Shield size={24} className="text-primary-600" />
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={m.profile?.full_name} url={m.profile?.avatar_url} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.profile?.full_name}</p>
                        <p className="text-xs text-gray-500">{m.profile?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as TeamRole)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                      <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                        {ROLE_CONFIG[m.role].description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditMemberId(editMemberId === m.id ? null : m.id)}
                        className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                      >
                        Permissions
                      </button>
                      {m.user_id !== profile?.id && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="rounded p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Permissions editor */}
          {editMemberId && (
            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Permissions for {members.find((m) => m.id === editMemberId)?.profile?.full_name}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                  const member = members.find((m) => m.id === editMemberId)
                  if (!member) return null
                  const checked = member.permissions?.[key as keyof TeamPermissions] ?? false
                  return (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handlePermToggle(editMemberId, member.permissions || DEFAULT_PERMISSIONS, key as keyof TeamPermissions)}
                        className="rounded border-gray-300 text-primary-600"
                      />
                      {label}
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-teams tab */}
      {tab === 'subteams' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowNewSubTeam(true)}>
              <Plus size={14} className="mr-1" /> New Sub-Team
            </Button>
          </div>

          {subTeams.map((st) => (
            <div key={st.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{st.name}</h3>
                <button onClick={() => deleteSubTeam(st.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {st.members?.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">
                    <Avatar name={m.profile?.full_name} size="sm" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{m.profile?.full_name}</span>
                    <button onClick={() => removeSubTeamMember(st.id, m.user_id)} className="text-gray-400 hover:text-red-500">
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <select
                  onChange={(e) => { if (e.target.value) { addSubTeamMember(st.id, e.target.value); e.target.value = '' } }}
                  className="rounded-full border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  defaultValue=""
                >
                  <option value="">+ Add member</option>
                  {members
                    .filter((m) => !st.members?.some((sm) => sm.user_id === m.user_id))
                    .map((m) => (
                      <option key={m.user_id} value={m.user_id}>{m.profile?.full_name}</option>
                    ))}
                </select>
              </div>
            </div>
          ))}

          {!subTeams.length && (
            <p className="py-8 text-center text-sm text-gray-400">No sub-teams yet</p>
          )}

          <Modal open={showNewSubTeam} onClose={() => setShowNewSubTeam(false)} title="Create Sub-Team" size="sm">
            <div className="space-y-4">
              <Input
                label="Sub-Team Name"
                value={subTeamName}
                onChange={(e) => setSubTeamName(e.target.value)}
                placeholder="e.g. Design Team"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowNewSubTeam(false)}>Cancel</Button>
                <Button onClick={handleCreateSubTeam} disabled={!subTeamName.trim()}>Create</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Templates tab */}
      {tab === 'templates' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <ProjectTemplateList teamId={currentTeam.id} />
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className="space-y-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 space-y-4 max-w-md">
            <Input label="Team Name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <Button onClick={handleSaveSettings}>Save Changes</Button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 max-w-lg">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h3>
            <AppearanceSettings team={currentTeam} />
          </div>
        </div>
      )}

      {/* Audit Log tab */}
      {tab === 'audit' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Audit Log</h3>
          <AuditLogViewer teamId={currentTeam.id} />
        </div>
      )}
    </div>
  )
}
