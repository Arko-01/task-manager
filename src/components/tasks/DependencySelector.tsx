import { useState } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useToast } from '../ui/Toast'
import type { TaskDependency } from '../../types'

interface Props {
  taskId: string
  dependencies: TaskDependency[]
}

export function DependencySelector({ taskId, dependencies }: Props) {
  const { tasks, addDependency, removeDependency } = useTaskStore()
  const { showToast } = useToast()
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')

  const depTaskIds = new Set(dependencies.map((d) => d.depends_on_task_id))
  const available = tasks.filter(
    (t) => t.id !== taskId && !depTaskIds.has(t.id) && !t.parent_id
  )
  const filtered = search
    ? available.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : available

  const handleAdd = async (dependsOnId: string) => {
    const { error } = await addDependency(taskId, dependsOnId)
    if (error) showToast(error, 'error')
    setShowPicker(false)
    setSearch('')
  }

  const handleRemove = async (depId: string) => {
    const { error } = await removeDependency(depId)
    if (error) showToast(error, 'error')
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Dependencies
      </label>

      {dependencies.map((dep) => (
        <div key={dep.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-2 py-1.5 dark:border-gray-800">
          <ArrowRight size={12} className="text-gray-400 shrink-0" />
          <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
            {dep.depends_on_task?.title || 'Unknown task'}
          </span>
          <span className="text-[10px] text-gray-400">blocked by</span>
          <button
            onClick={() => handleRemove(dep.id)}
            aria-label={`Remove dependency: ${dep.depends_on_task?.title || 'Unknown task'}`}
            className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {!showPicker ? (
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Plus size={12} />
          Add dependency
        </button>
      ) : (
        <div className="space-y-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks to add as dependency"
            autoFocus
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {filtered.slice(0, 10).map((t) => (
              <button
                key={t.id}
                onClick={() => handleAdd(t.id)}
                aria-label={`Add dependency: ${t.title}`}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="truncate text-gray-700 dark:text-gray-300">{t.title}</span>
              </button>
            ))}
            {!filtered.length && (
              <p className="px-2 py-1.5 text-xs text-gray-400">No tasks available</p>
            )}
          </div>
          <button
            onClick={() => { setShowPicker(false); setSearch('') }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
