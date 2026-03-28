import { Calendar } from 'lucide-react'
import { PRIORITY_CONFIG } from '../../types'
import type { Task } from '../../types'
import { Avatar } from '../ui/Avatar'

interface Props {
  task: Task
  onSelect: (task: Task) => void
  isDragging?: boolean
}

export function TaskCard({ task, onSelect, isDragging }: Props) {
  const priority = PRIORITY_CONFIG[task.priority]
  const isOverdue = new Date(task.end_date) < new Date() && task.status !== 'done'
  const subDone = task.sub_tasks?.filter((st) => st.status === 'done').length || 0
  const subTotal = task.sub_tasks?.length || 0

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      onClick={() => onSelect(task)}
      className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${
        isDragging ? 'shadow-lg ring-2 ring-primary-500/30' : ''
      }`}
    >
      {/* Priority + Title */}
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${priority.dotClass}`} />
        <span className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
          {task.title}
        </span>
      </div>

      {/* Meta row */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Due date */}
          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
            <Calendar size={11} />
            {formatDate(task.end_date)}
          </span>

          {/* Sub-task count */}
          {subTotal > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {subDone}/{subTotal}
            </span>
          )}
        </div>

        {/* Assignees */}
        <div className="flex -space-x-1">
          {task.assignees?.slice(0, 3).map((a) => (
            <Avatar key={a.user_id} name={a.profile?.full_name} url={a.profile?.avatar_url} size="sm" />
          ))}
        </div>
      </div>

      {/* Project tag (for dashboard views) */}
      {task.project && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {task.project.emoji} {task.project.name}
          </span>
        </div>
      )}
    </div>
  )
}
