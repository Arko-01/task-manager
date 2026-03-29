import { useMemo } from 'react'
import { STATUS_CONFIG } from '../../types'
import type { Task, TaskStatus } from '../../types'
import { TaskCard } from './TaskCard'
import { QuickAddTask } from './QuickAddTask'

interface Props {
  tasks: Task[]
  projectId?: string
  onSelectTask: (task: Task) => void
  onStatusChange?: (taskId: string, status: TaskStatus) => void
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'on_hold', 'done']

export function TaskBoard({ tasks, projectId, onSelectTask, onStatusChange }: Props) {
  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks])

  const columns = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], on_hold: [], done: [] }
    for (const task of rootTasks) map[task.status].push(task)
    return map
  }, [rootTasks])

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId && onStatusChange) onStatusChange(taskId, status)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => {
        const items = columns[status]
        const config = STATUS_CONFIG[status]

        return (
          <div
            key={status}
            className="flex w-full sm:w-72 shrink-0 flex-col rounded-lg bg-gray-50 dark:bg-gray-800/50"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-3">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 px-2 pb-2 min-h-[100px]">
              {items.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                  <TaskCard task={task} onSelect={onSelectTask} />
                </div>
              ))}
            </div>

            {/* Quick add */}
            <div className="px-2 pb-2">
              <QuickAddTask projectId={projectId} status={status} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
