import { useState, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { Task, TaskStatus } from '../../types'
import { STATUS_CONFIG, PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { TaskTypeIcon } from './TaskTypeIcon'

interface Props {
  tasks: Task[]
  onSelect: (task: Task) => void
  onStatusChange?: (taskId: string, status: TaskStatus) => void
}

type SortKey = 'title' | 'type' | 'status' | 'priority' | 'assignee' | 'due' | 'tags' | 'time'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<TaskStatus, number> = { todo: 0, in_progress: 1, on_hold: 2, done: 3 }

export function TaskTable({ tasks, onSelect, onStatusChange }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editingPriority, setEditingPriority] = useState<string | null>(null)

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'title':
        cmp = a.title.localeCompare(b.title)
        break
      case 'type':
        cmp = a.task_type.localeCompare(b.task_type)
        break
      case 'status':
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        break
      case 'priority':
        cmp = a.priority - b.priority
        break
      case 'assignee':
        cmp = (a.assignees?.[0]?.profile?.full_name || '').localeCompare(b.assignees?.[0]?.profile?.full_name || '')
        break
      case 'due':
        cmp = new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
        break
      case 'tags':
        cmp = (a.tags?.length || 0) - (b.tags?.length || 0)
        break
      case 'time':
        cmp = a.time_spent_days - b.time_spent_days
        break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === col && (
          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        )}
      </span>
    </th>
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
          <tr>
            <SortHeader label="Title" col="title" />
            <SortHeader label="Type" col="type" />
            <SortHeader label="Status" col="status" />
            <SortHeader label="Priority" col="priority" />
            <SortHeader label="Assignee" col="assignee" />
            <SortHeader label="Due Date" col="due" />
            <SortHeader label="Tags" col="tags" />
            <SortHeader label="Time" col="time" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map((task, i) => {
            const status = STATUS_CONFIG[task.status]
            const priority = PRIORITY_CONFIG[task.priority]
            const isOverdue = new Date(task.end_date) < new Date() && task.status !== 'done'

            return (
              <tr
                key={task.id}
                className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''
                }`}
              >
                {/* Title */}
                <td
                  className="cursor-pointer px-3 py-2 font-medium text-gray-900 dark:text-gray-100"
                  onClick={() => onSelect(task)}
                >
                  <span className={task.status === 'done' ? 'text-gray-400 line-through dark:text-gray-500' : ''}>
                    {task.title}
                  </span>
                </td>

                {/* Type */}
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <TaskTypeIcon type={task.task_type} size={12} />
                    {TASK_TYPE_CONFIG[task.task_type].label}
                  </span>
                </td>

                {/* Status - inline select */}
                <td className="px-3 py-2">
                  {editingStatus === task.id ? (
                    <select
                      autoFocus
                      value={task.status}
                      onChange={(e) => {
                        onStatusChange?.(task.id, e.target.value as TaskStatus)
                        setEditingStatus(null)
                      }}
                      onBlur={() => setEditingStatus(null)}
                      className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge
                      className={`${status.badgeClass} cursor-pointer`}
                      onClick={() => onStatusChange && setEditingStatus(task.id)}
                    >
                      {status.label}
                    </Badge>
                  )}
                </td>

                {/* Priority - inline select */}
                <td className="px-3 py-2">
                  {editingPriority === task.id ? (
                    <select
                      autoFocus
                      value={task.priority}
                      onChange={() => {
                        // Priority changes would need a handler; for now just close
                        setEditingPriority(null)
                      }}
                      onBlur={() => setEditingPriority(null)}
                      className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {([1, 2, 3, 4] as const).map((p) => (
                        <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="inline-flex cursor-pointer items-center gap-1 text-xs"
                      onClick={() => setEditingPriority(task.id)}
                    >
                      <span className={`h-2 w-2 rounded-full ${priority.dotClass}`} />
                      <span className="text-gray-700 dark:text-gray-300">{priority.label}</span>
                    </span>
                  )}
                </td>

                {/* Assignee */}
                <td className="px-3 py-2" onClick={() => onSelect(task)}>
                  <div className="flex -space-x-1">
                    {task.assignees?.slice(0, 3).map((a) => (
                      <Avatar key={a.user_id} name={a.profile?.full_name} url={a.profile?.avatar_url} size="xs" />
                    ))}
                    {!task.assignees?.length && (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </div>
                </td>

                {/* Due Date */}
                <td className={`px-3 py-2 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {formatDate(task.end_date)}
                </td>

                {/* Tags */}
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {task.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary-50 px-1.5 py-0 text-[10px] font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {(task.tags?.length || 0) > 2 && (
                      <span className="text-[10px] text-gray-400">+{(task.tags?.length || 0) - 2}</span>
                    )}
                  </div>
                </td>

                {/* Time */}
                <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  {task.time_spent_days > 0 ? `${task.time_spent_days}d` : '--'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No tasks to display</div>
      )}
    </div>
  )
}
