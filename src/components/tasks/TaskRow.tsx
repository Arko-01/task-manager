import { useState } from 'react'
import { ChevronRight, GripVertical, Calendar, User2 } from 'lucide-react'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../types'
import type { Task } from '../../types'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'

interface Props {
  task: Task
  onSelect: (task: Task) => void
  onStatusChange?: (taskId: string, status: Task['status']) => void
  level?: number
  selected?: boolean
  onToggleSelect?: (taskId: string) => void
}

export function TaskRow({ task, onSelect, onStatusChange, level = 0, selected, onToggleSelect }: Props) {
  const [expanded, setExpanded] = useState(true)
  const hasSubTasks = task.sub_tasks && task.sub_tasks.length > 0
  const priority = PRIORITY_CONFIG[task.priority]
  const status = STATUS_CONFIG[task.status]
  const isOverdue = new Date(task.end_date) < new Date() && task.status !== 'done'

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      <div
        className={`group flex items-center gap-2 border-b border-gray-100 px-3 py-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${selected ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
        style={{ paddingLeft: `${12 + level * 24}px` }}
      >
        {/* Checkbox */}
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(task.id)}
            aria-label={`Select task: ${task.title}`}
            className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        )}

        {/* Drag handle */}
        <GripVertical size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />

        {/* Expand toggle for sub-tasks */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          aria-label={expanded ? `Collapse sub-tasks of ${task.title}` : `Expand sub-tasks of ${task.title}`}
          className={`shrink-0 ${hasSubTasks ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' : 'invisible'}`}
        >
          <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {/* Priority dot */}
        <span className={`h-2 w-2 rounded-full shrink-0 ${priority.dotClass}`} title={priority.label} />

        {/* Status checkbox circle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            const nextStatus = task.status === 'done' ? 'todo' : 'done'
            onStatusChange?.(task.id, nextStatus)
          }}
          aria-label={task.status === 'done' ? `Mark "${task.title}" as todo` : `Mark "${task.title}" as done`}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            task.status === 'done'
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-gray-300 hover:border-green-400 dark:border-gray-600'
          }`}
        >
          {task.status === 'done' && (
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Title + Tags */}
        <div onClick={() => onSelect(task)} className="flex-1 min-w-0 flex items-center gap-1.5 cursor-pointer">
          <span className={`truncate text-sm ${
            task.status === 'done'
              ? 'text-gray-400 line-through dark:text-gray-500'
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {task.title}
          </span>
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="shrink-0 rounded-full bg-primary-50 px-1.5 py-0 text-[10px] font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              {tag}
            </span>
          ))}
          {(task.tags?.length || 0) > 2 && (
            <span className="shrink-0 text-[10px] text-gray-400">+{(task.tags?.length || 0) - 2}</span>
          )}
        </div>

        {/* Status badge */}
        <Badge className={`${status.badgeClass} shrink-0`}>
          {status.label}
        </Badge>

        {/* Assignees */}
        <div className="flex -space-x-1 shrink-0">
          {task.assignees?.slice(0, 3).map((a) => (
            <Avatar key={a.user_id} name={a.profile?.full_name} url={a.profile?.avatar_url} size="sm" />
          ))}
          {(task.assignees?.length || 0) > 3 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              +{(task.assignees?.length || 0) - 3}
            </span>
          )}
          {!task.assignees?.length && <User2 size={14} className="text-gray-300 dark:text-gray-600" />}
        </div>

        {/* Due date */}
        <div className={`flex items-center gap-1 shrink-0 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
          <Calendar size={12} />
          {formatDate(task.end_date)}
        </div>

        {/* Sub-task count */}
        {hasSubTasks && (
          <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
            {task.sub_tasks!.filter((st) => st.status === 'done').length}/{task.sub_tasks!.length}
          </span>
        )}
      </div>

      {/* Sub-tasks */}
      {expanded && hasSubTasks && task.sub_tasks!.map((sub) => (
        <TaskRow
          key={sub.id}
          task={sub}
          onSelect={onSelect}
          onStatusChange={onStatusChange}
          level={level + 1}
          selected={selected}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </>
  )
}
