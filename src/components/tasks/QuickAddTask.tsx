import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useProjectStore } from '../../store/projectStore'
import { useToast } from '../ui/Toast'
import { usePermissions } from '../../hooks/usePermissions'
import type { TaskStatus } from '../../types'

interface Props {
  projectId?: string
  parentId?: string
  status?: TaskStatus
  onCreated?: () => void
}

export function QuickAddTask({ projectId, parentId, status = 'todo', onCreated }: Props) {
  const { can } = usePermissions()
  if (!can('create_tasks')) return null
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')
  const { createTask } = useTaskStore()
  const { projects } = useProjectStore()
  const { showToast } = useToast()

  const effectiveProjectId = projectId || selectedProjectId
  const selectedProject = projects.find((p) => p.id === effectiveProjectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !effectiveProjectId) {
      if (!effectiveProjectId) showToast('Please select a project first', 'error')
      return
    }

    setLoading(true)
    const project = projects.find((p) => p.id === effectiveProjectId)
    const { error } = await createTask({
      project_id: effectiveProjectId,
      title: title.trim(),
      start_date: project?.start_date || new Date().toISOString().split('T')[0],
      end_date: project?.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      parent_id: parentId,
      status,
    })
    setLoading(false)
    if (error) {
      showToast(error, 'error')
    } else {
      setTitle('')
      onCreated?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 focus-within:border-primary-500 dark:border-gray-600 dark:focus-within:border-primary-500">
        <Plus size={16} className="text-gray-400 shrink-0" />
        {!projectId && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {selectedProject ? `${selectedProject.emoji || '📁'} ${selectedProject.name}` : 'Select Project'}
            </button>
            {showProjectPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProjectPicker(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProjectId(p.id); setShowProjectPicker(false) }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <span>{p.emoji || '📁'}</span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
          disabled={loading}
        />
      </div>
    </form>
  )
}
