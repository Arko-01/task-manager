import { useState, useRef, useCallback, type ReactNode } from 'react'
import type { Task } from '../../types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'

interface Props {
  task: Task
  children: ReactNode
}

export function TaskHoverPreview({ task, children }: Props) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 300)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  const status = STATUS_CONFIG[task.status]
  const priority = PRIORITY_CONFIG[task.priority]
  const description = task.description
    ? task.description.length > 100
      ? task.description.slice(0, 100) + '...'
      : task.description
    : 'No description'
  const subTotal = task.sub_tasks?.length || 0
  const subDone = task.sub_tasks?.filter((st) => st.status === 'done').length || 0

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[280px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {/* Title */}
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{task.title}</p>

          {/* Description */}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>

          {/* Status + Priority badges */}
          <div className="mt-2 flex items-center gap-2">
            <Badge className={status.badgeClass}>{status.label}</Badge>
            <Badge className={`${priority.dotClass.replace('bg-', 'bg-').replace('-500', '-100').replace('-400', '-100')} text-xs`}>
              <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${priority.dotClass}`} />
              {priority.label}
            </Badge>
          </div>

          {/* Assignees */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              {task.assignees.slice(0, 5).map((a) => (
                <div key={a.user_id} className="flex items-center gap-1">
                  <Avatar name={a.profile?.full_name} url={a.profile?.avatar_url} size="xs" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{a.profile?.full_name || 'Unknown'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Due date + Sub-task count */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Due: {new Date(task.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {subTotal > 0 && (
              <span>Sub-tasks: {subDone}/{subTotal}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
