import { useState } from 'react'
import { ChevronRight, ChevronDown, Star } from 'lucide-react'
import type { Project } from '../../types'

interface Props {
  projects: Project[]
  currentProjectId: string | null
  onSelect: (projectId: string) => void
  taskCounts: Record<string, number>
  favorites: string[]
  onToggleFavorite: (id: string) => void
}

interface TreeNodeProps {
  project: Project
  children: Project[]
  allProjects: Project[]
  level: number
  currentProjectId: string | null
  onSelect: (projectId: string) => void
  taskCounts: Record<string, number>
  favorites: string[]
  onToggleFavorite: (id: string) => void
}

function TreeNode({ project, children, allProjects, level, currentProjectId, onSelect, taskCounts, favorites, onToggleFavorite }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const isActive = project.id === currentProjectId
  const isFav = favorites.includes(project.id)
  const hasChildren = children.length > 0

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors cursor-pointer ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(project.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        <span className="text-base leading-none shrink-0">{project.emoji || '📁'}</span>
        <span className="truncate flex-1">{project.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(project.id) }}
          className={`shrink-0 transition-opacity ${
            isFav
              ? 'text-amber-400 hover:text-amber-500 opacity-100'
              : 'text-gray-300 hover:text-amber-400 opacity-0 group-hover:opacity-100 dark:text-gray-600'
          }`}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
        </button>
        {taskCounts[project.id] > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
            {taskCounts[project.id]}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map((child) => {
            const grandChildren = allProjects.filter((p) => p.parent_project_id === child.id)
            return (
              <TreeNode
                key={child.id}
                project={child}
                children={grandChildren}
                allProjects={allProjects}
                level={level + 1}
                currentProjectId={currentProjectId}
                onSelect={onSelect}
                taskCounts={taskCounts}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ProjectFolderTree({ projects, currentProjectId, onSelect, taskCounts, favorites, onToggleFavorite }: Props) {
  // Sort: default first, then by created_at
  const sorted = [...projects].sort((a, b) => {
    if (a.is_default && !b.is_default) return -1
    if (!a.is_default && b.is_default) return 1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const rootProjects = sorted.filter((p) => !p.parent_project_id)

  if (!projects.length) {
    return <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">No projects yet</p>
  }

  return (
    <div className="space-y-0.5">
      {rootProjects.map((project) => {
        const children = sorted.filter((p) => p.parent_project_id === project.id)
        return (
          <TreeNode
            key={project.id}
            project={project}
            children={children}
            allProjects={sorted}
            level={0}
            currentProjectId={currentProjectId}
            onSelect={onSelect}
            taskCounts={taskCounts}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        )
      })}
    </div>
  )
}
