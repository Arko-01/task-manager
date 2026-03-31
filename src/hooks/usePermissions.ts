import { useAuthStore } from '../store/authStore'
import { useTeamStore } from '../store/teamStore'
import { DEFAULT_PERMISSIONS } from '../types'
import type { TeamPermissions } from '../types'

/**
 * Hook that returns the current user's effective permissions.
 * Merges role-based defaults with any custom per-member overrides.
 */
export function usePermissions() {
  const profile = useAuthStore((s) => s.profile)
  const members = useTeamStore((s) => s.members)

  const currentMember = members.find((m) => m.user_id === profile?.id)
  const permissions: TeamPermissions = currentMember?.permissions || DEFAULT_PERMISSIONS

  const isAdmin = currentMember?.role === 'admin' || permissions.full_access

  return {
    /** Raw permissions object */
    permissions,
    /** Current user's member record */
    currentMember,
    /** Whether current user is admin (role or full_access) */
    isAdmin,
    /** Check a specific permission — admins always return true */
    can: (perm: keyof TeamPermissions) => isAdmin || permissions[perm],
    /** Whether the user can edit a specific task (own vs all) */
    canEditTask: (taskCreatorId?: string) => {
      if (isAdmin) return true
      if (permissions.edit_all_tasks) return true
      if (permissions.edit_own_tasks && taskCreatorId === profile?.id) return true
      return false
    },
  }
}
