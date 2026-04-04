import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useProjectStore } from '../../store/projectStore'

export function Breadcrumbs() {
  const location = useLocation()
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjectStore()

  const crumbs: { label: string; path?: string; emoji?: string }[] = []

  if (location.pathname === '/' || location.pathname === '') {
    crumbs.push({ label: 'My Tasks' })
  } else if (location.pathname === '/team') {
    crumbs.push({ label: 'Team Dashboard' })
  } else if (location.pathname === '/admin') {
    crumbs.push({ label: 'Admin Panel' })
  } else if (location.pathname === '/trash') {
    crumbs.push({ label: 'Trash' })
  } else if (location.pathname === '/profile') {
    crumbs.push({ label: 'Profile' })
  } else if (projectId) {
    const project = projects.find((p) => p.id === projectId)
    crumbs.push({ label: 'My Tasks', path: '/' })
    if (project) {
      crumbs.push({ label: project.name, emoji: project.emoji || undefined })
    }
  }

  if (crumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-gray-700 dark:hover:text-gray-300">
        <Home size={12} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-gray-300 dark:text-gray-600" />
          {crumb.path ? (
            <Link to={crumb.path} className="hover:text-gray-700 dark:hover:text-gray-300">
              {crumb.emoji && <span className="mr-0.5">{crumb.emoji}</span>}
              {crumb.label}
            </Link>
          ) : (
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {crumb.emoji && <span className="mr-0.5">{crumb.emoji}</span>}
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
