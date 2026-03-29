import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useTeamStore } from '../../store/teamStore'
import { useProjectStore } from '../../store/projectStore'
import { LayoutDashboard, Settings, LogOut, Plus, Inbox, Users, Trash2, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TeamSwitcher } from '../team/TeamSwitcher'
import { InviteModal } from '../team/InviteModal'
import { CreateProjectModal } from '../project/CreateProjectModal'

export function Sidebar({ collapsed, onCollapse: _onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  const { profile, signOut } = useAuthStore()
  const { currentTeam, fetchTeams, members } = useTeamStore()
  const { projects, fetchProjects } = useProjectStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showInvite, setShowInvite] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  useEffect(() => {
    if (currentTeam) {
      fetchProjects(currentTeam.id)
    }
  }, [currentTeam, fetchProjects])

  const isActive = (path: string) => location.pathname === path

  const navItemClass = (path: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
      isActive(path)
        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`

  // Check if current user is admin
  const currentMember = members.find((m) => m.user_id === profile?.id)
  const isAdmin = currentMember?.role === 'admin' || currentMember?.permissions?.full_access

  const [showAllProjects, setShowAllProjects] = useState(false)

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.is_default && !b.is_default) return -1
    if (!a.is_default && b.is_default) return 1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const PROJECT_COLLAPSE_LIMIT = 5
  const visibleProjects = showAllProjects ? sortedProjects : sortedProjects.slice(0, PROJECT_COLLAPSE_LIMIT)
  const hasMoreProjects = sortedProjects.length > PROJECT_COLLAPSE_LIMIT

  if (collapsed) return null

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Team Header */}
      <div className="border-b border-gray-200 px-3 py-3 dark:border-gray-800">
        <TeamSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div onClick={() => navigate('/')} className={navItemClass('/')}>
          <LayoutDashboard size={18} />
          <span>My Tasks</span>
        </div>

        {currentTeam && (
          <div onClick={() => navigate('/team')} className={navItemClass('/team')}>
            <Inbox size={18} />
            <span>Team Dashboard</span>
          </div>
        )}

        {/* Projects Section */}
        {currentTeam && (
          <div className="pt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Projects
              </span>
              <button
                onClick={() => setShowCreateProject(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="New project"
              >
                <Plus size={14} />
              </button>
            </div>

            {visibleProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className={navItemClass(`/projects/${project.id}`)}
              >
                <span className="text-base leading-none">{project.emoji || '📁'}</span>
                <span className="truncate">{project.name}</span>
              </div>
            ))}

            {hasMoreProjects && (
              <button
                onClick={() => setShowAllProjects(!showAllProjects)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {showAllProjects ? 'Show less' : `Show all (${sortedProjects.length})`}
              </button>
            )}

            {!projects.length && (
              <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">No projects yet</p>
            )}
          </div>
        )}

        {/* Admin & Team Section */}
        {currentTeam && (
          <div className="pt-6 space-y-1">
            {isAdmin && (
              <div onClick={() => navigate('/admin')} className={navItemClass('/admin')}>
                <Settings size={18} />
                <span>Admin Panel</span>
              </div>
            )}
            <div
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Users size={18} />
              <span>Invite Member</span>
            </div>
            <div onClick={() => navigate('/trash')} className={navItemClass('/trash')}>
              <Trash2 size={18} />
              <span>Trash</span>
            </div>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {profile?.full_name || 'User'}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {profile?.email}
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Profile"
          >
            <User size={16} />
          </button>
          <button
            onClick={signOut}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
      <CreateProjectModal open={showCreateProject} onClose={() => setShowCreateProject(false)} />
    </aside>
  )
}
