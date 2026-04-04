import { useEffect, useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { useToast } from '../ui/Toast'
import type { Project } from '../../types'

interface Props {
  projectId: string
  allProjects: Project[]
}

export function ProjectDependencies({ projectId, allProjects }: Props) {
  const { projectDependencies, fetchProjectDependencies, addProjectDependency, removeProjectDependency, getProjectStatus } = useProjectStore()
  const { showToast } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [completedProjects, setCompletedProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchProjectDependencies(projectId)
  }, [projectId, fetchProjectDependencies])

  // Check completion status of dependency projects
  useEffect(() => {
    const checkStatuses = async () => {
      const completed = new Set<string>()
      for (const dep of projectDependencies) {
        const { status } = await getProjectStatus(dep.depends_on_project_id)
        if (status === 'completed') completed.add(dep.depends_on_project_id)
      }
      setCompletedProjects(completed)
    }
    if (projectDependencies.length) checkStatuses()
  }, [projectDependencies, getProjectStatus])

  const availableProjects = allProjects.filter(
    (p) => p.id !== projectId && !projectDependencies.some((d) => d.depends_on_project_id === p.id)
  )

  const handleAdd = async (dependsOnId: string) => {
    const { error } = await addProjectDependency(projectId, dependsOnId)
    if (error) showToast(error, 'error')
    setShowAdd(false)
  }

  const handleRemove = async (depId: string) => {
    const { error } = await removeProjectDependency(depId)
    if (error) showToast(error, 'error')
  }

  if (!projectDependencies.length && !showAdd) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Dependencies
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Add dependency"
        >
          <Plus size={14} />
        </button>
      </div>

      {projectDependencies.map((dep) => {
        const depProject = dep.depends_on_project || allProjects.find((p) => p.id === dep.depends_on_project_id)
        const isCompleted = completedProjects.has(dep.depends_on_project_id)

        return (
          <div
            key={dep.id}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            {!isCompleted && (
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
            )}
            <span className="text-sm leading-none">{depProject?.emoji || '📁'}</span>
            <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
              {depProject?.name || 'Unknown project'}
            </span>
            <button
              onClick={() => handleRemove(dep.id)}
              className="shrink-0 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}

      {showAdd && (
        <select
          onChange={(e) => { if (e.target.value) handleAdd(e.target.value) }}
          defaultValue=""
          autoFocus
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Select a project...</option>
          {availableProjects.map((p) => (
            <option key={p.id} value={p.id}>{p.emoji || '📁'} {p.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
