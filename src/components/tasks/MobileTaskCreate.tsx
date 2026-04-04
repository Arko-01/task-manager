import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useTaskStore } from '../../store/taskStore'
import { useProjectStore } from '../../store/projectStore'
import { useToast } from '../ui/Toast'
import type { TaskPriority } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dotClass: string }[] = [
  { value: 1, label: 'Urgent', dotClass: 'bg-red-500' },
  { value: 2, label: 'High', dotClass: 'bg-orange-500' },
  { value: 3, label: 'Medium', dotClass: 'bg-yellow-500' },
  { value: 4, label: 'Low', dotClass: 'bg-gray-400' },
]

export function MobileTaskCreate({ isOpen, onClose, projectId }: Props) {
  const [title, setTitle] = useState('')
  const [selectedProject, setSelectedProject] = useState(projectId || '')
  const [priority, setPriority] = useState<TaskPriority>(3)
  const [submitting, setSubmitting] = useState(false)

  const { createTask } = useTaskStore()
  const { projects } = useProjectStore()
  const { toast } = useToast()

  const resetForm = () => {
    setTitle('')
    setPriority(3)
    if (!projectId) setSelectedProject('')
  }

  const handleSubmit = async () => {
    const targetProject = projectId || selectedProject
    if (!title.trim() || !targetProject) return

    setSubmitting(true)
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    const { error } = await createTask({
      project_id: targetProject,
      title: title.trim(),
      priority,
      start_date: today,
      end_date: nextWeek,
    })

    setSubmitting(false)

    if (error) {
      toast(error, 'error')
    } else {
      toast('Task created', 'success')
      resetForm()
      onClose()
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="New Task">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <input
          autoFocus
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSubmit() }}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          aria-label="Task title"
        />

        {/* Project selector (only if no projectId prop) */}
        {!projectId && (
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            aria-label="Select project"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji ? `${p.emoji} ` : ''}{p.name}
              </option>
            ))}
          </select>
        )}

        {/* Priority selector */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Priority</label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                  priority === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
                aria-label={`Set priority to ${opt.label}`}
                aria-pressed={priority === opt.value}
              >
                <span className={`h-2 w-2 rounded-full ${opt.dotClass}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create button */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || (!projectId && !selectedProject) || submitting}
          className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </div>
    </BottomSheet>
  )
}
