import { Calendar, Clock } from 'lucide-react'
import { PRIORITY_CONFIG } from '../../types'
import type { Task } from '../../types'
import { Avatar } from '../ui/Avatar'
import { TaskTypeIcon } from './TaskTypeIcon'
import { RecurrenceBadge } from './RecurrenceBadge'
import { TaskHoverPreview } from './TaskHoverPreview'

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
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(task) } }}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}, priority: ${priority.label}`}
      className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 ${
        isDragging ? 'shadow-lg ring-2 ring-primary-500/30' : ''
      }`}
    >
      {/* Priority + Type + Title */}
      <TaskHoverPreview task={task}>
        <div className="flex items-start gap-2">
          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${priority.dotClass}`} />
          <TaskTypeIcon type={task.task_type} size={12} className="mt-1 shrink-0" />
          <span className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
            {task.title}
          </span>
        </div>
      </TaskHoverPreview>

      {/* Recurrence badge */}
      {task.is_recurring && task.recurrence_pattern && (
        <div className="mt-1.5">
          <RecurrenceBadge isRecurring={task.is_recurring} pattern={task.recurrence_pattern} />
        </div>
      )}

      {/* Meta row */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Due date */}
          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
            <Calendar size={11} />
            {formatDate(task.end_date)}
          </span>

          {/* Time spent */}
          {task.time_spent_days > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock size={11} />
              {task.time_spent_days}d
            </span>
          )}

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
