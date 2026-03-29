import { useState } from 'react'
import { X } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useTeamStore } from '../../store/teamStore'
import { useToast } from '../ui/Toast'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types'
import type { TaskStatus, TaskPriority } from '../../types'

interface Props {
  selectedIds: Set<string>
  onClear: () => void
}

export function BulkActions({ selectedIds, onClear }: Props) {
  const { updateTask, deleteTask, addAssignee } = useTaskStore()
  const { members } = useTeamStore()
  const { showToast } = useToast()
  const count = selectedIds.size
  const [showAssign, setShowAssign] = useState(false)
  const [showPriority, setShowPriority] = useState(false)

  if (!count) return null

  const ids = Array.from(selectedIds)

  const handleStatusChange = async (status: TaskStatus) => {
    await Promise.all(ids.map((id) => updateTask(id, { status })))
    showToast(`Updated ${count} tasks`, 'success')
    onClear()
  }

  const handlePriorityChange = async (priority: TaskPriority) => {
    await Promise.all(ids.map((id) => updateTask(id, { priority })))
    showToast(`Set priority on ${count} tasks`, 'success')
    setShowPriority(false)
    onClear()
  }

  const handleAssign = async (userId: string) => {
    await Promise.all(ids.map((id) => addAssignee(id, userId, 'secondary')))
    showToast(`Assigned to ${count} tasks`, 'success')
    setShowAssign(false)
    onClear()
  }

  const handleDateShift = async (days: number) => {
    await Promise.all(ids.map(async (id) => {
      const task = useTaskStore.getState().tasks.find((t) => t.id === id)
      if (!task) return
      const shift = (d: string) => {
        const date = new Date(d)
        date.setDate(date.getDate() + days)
        return date.toISOString().split('T')[0]
      }
      await updateTask(id, { start_date: shift(task.start_date), end_date: shift(task.end_date) })
    }))
    showToast(`Shifted dates by ${days > 0 ? '+' : ''}${days}d`, 'success')
    onClear()
  }

  const handleDelete = async () => {
    await Promise.all(ids.map((id) => deleteTask(id)))
    showToast(`Moved ${count} tasks to trash`, 'info')
    onClear()
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xl dark:border-gray-700 dark:bg-gray-800 max-w-[90vw]">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{count} selected</span>
      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Status */}
      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
        <button key={status} onClick={() => handleStatusChange(status as TaskStatus)} className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
          {config.label}
        </button>
      ))}

      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Priority */}
      <div className="relative">
        <button onClick={() => { setShowPriority(!showPriority); setShowAssign(false) }} className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
          Priority
        </button>
        {showPriority && (
          <div className="absolute bottom-full left-0 mb-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <button key={k} onClick={() => handlePriorityChange(Number(k) as TaskPriority)} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700">
                <span className={`h-2 w-2 rounded-full ${v.dotClass}`} />
                <span className="text-gray-700 dark:text-gray-300">{v.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assign */}
      <div className="relative">
        <button onClick={() => { setShowAssign(!showAssign); setShowPriority(false) }} className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
          Assign
        </button>
        {showAssign && (
          <div className="absolute bottom-full left-0 mb-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 w-44">
            {members.map((m) => (
              <button key={m.user_id} onClick={() => handleAssign(m.user_id)} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700">
                <span className="text-gray-700 dark:text-gray-300 truncate">{m.profile?.full_name || m.profile?.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date shift */}
      <button onClick={() => handleDateShift(1)} className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">+1d</button>
      <button onClick={() => handleDateShift(7)} className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">+7d</button>

      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
      <button onClick={handleDelete} className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">Delete</button>
      <button onClick={onClear} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={14} /></button>
    </div>
  )
}
