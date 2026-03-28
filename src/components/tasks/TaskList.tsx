import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { STATUS_CONFIG } from '../../types'
import type { Task, TaskStatus } from '../../types'
import { TaskRow } from './TaskRow'
import { QuickAddTask } from './QuickAddTask'

interface Props {
  tasks: Task[]
  projectId?: string
  onSelectTask: (task: Task) => void
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  selectedIds?: Set<string>
  onToggleSelect?: (taskId: string) => void
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'on_hold', 'done']

export function TaskList({ tasks, projectId, onSelectTask, onStatusChange, selectedIds, onToggleSelect }: Props) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Only show root tasks (parent_id === null), sub-tasks rendered inside TaskRow
  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks])

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], on_hold: [], done: [] }
    for (const task of rootTasks) {
      map[task.status].push(task)
    }
    return map
  }, [rootTasks])

  const toggleSection = (status: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {STATUS_ORDER.map((status) => {
        const items = grouped[status]
        const config = STATUS_CONFIG[status]
        const isCollapsed = collapsedSections.has(status)

        return (
          <div key={status}>
            {/* Section Header */}
            <div
              onClick={() => toggleSection(status)}
              className="flex cursor-pointer items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-800/50"
            >
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
              />
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{items.length}</span>
            </div>

            {/* Tasks */}
            {!isCollapsed && (
              <div>
                {items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onSelect={onSelectTask}
                    onStatusChange={onStatusChange}
                    selected={selectedIds?.has(task.id)}
                    onToggleSelect={onToggleSelect}
                  />
                ))}
                {/* Quick add at bottom of section */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <QuickAddTask projectId={projectId} status={status} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
