import { X } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useToast } from '../ui/Toast'
import { STATUS_CONFIG } from '../../types'
import type { TaskStatus } from '../../types'

interface Props {
  selectedIds: Set<string>
  onClear: () => void
}

export function BulkActions({ selectedIds, onClear }: Props) {
  const { updateTask, deleteTask } = useTaskStore()
  const { showToast } = useToast()
  const count = selectedIds.size

  if (!count) return null

  const handleStatusChange = async (status: TaskStatus) => {
    const promises = Array.from(selectedIds).map((id) => updateTask(id, { status }))
    await Promise.all(promises)
    showToast(`Updated ${count} tasks`, 'success')
    onClear()
  }

  const handleDelete = async () => {
    const promises = Array.from(selectedIds).map((id) => deleteTask(id))
    await Promise.all(promises)
    showToast(`Moved ${count} tasks to trash`, 'info')
    onClear()
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {count} selected
      </span>

      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
        <button
          key={status}
          onClick={() => handleStatusChange(status as TaskStatus)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {config.label}
        </button>
      ))}

      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

      <button
        onClick={handleDelete}
        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        Delete
      </button>

      <button onClick={onClear} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <X size={14} />
      </button>
    </div>
  )
}
