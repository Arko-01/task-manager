import { useMemo, useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { STATUS_CONFIG } from '../../types'
import type { Task, TaskStatus } from '../../types'
import { TaskRow } from './TaskRow'
import { QuickAddTask } from './QuickAddTask'
import { useTaskStore } from '../../store/taskStore'

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
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragSrcStatus = useRef<TaskStatus | null>(null)
  const { updateTask } = useTaskStore()

  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks])

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], on_hold: [], done: [] }
    for (const task of rootTasks) map[task.status].push(task)
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

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.effectAllowed = 'move'
    dragSrcStatus.current = task.status
    setDraggingId(task.id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
    dragSrcStatus.current = null
  }

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (taskId !== draggingId) setDragOverId(taskId)
  }

  const handleDrop = async (e: React.DragEvent, targetTask: Task, status: TaskStatus) => {
    e.preventDefault()
    const srcId = e.dataTransfer.getData('taskId')
    if (!srcId || srcId === targetTask.id) { setDragOverId(null); return }

    const items = grouped[status]
    const targetIdx = items.findIndex((t) => t.id === targetTask.id)

    if (dragSrcStatus.current === status) {
      // Reorder within same section — reassign positions
      const reordered = items.filter((t) => t.id !== srcId)
      reordered.splice(targetIdx, 0, items.find((t) => t.id === srcId)!)
      await Promise.all(reordered.map((t, i) => updateTask(t.id, { position: i })))
    } else {
      // Cross-column drop — change status and position
      if (onStatusChange) onStatusChange(srcId, status)
      await updateTask(srcId, { status, position: targetIdx })
    }
    setDragOverId(null)
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
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, task.id)}
                    onDrop={(e) => handleDrop(e, task, status)}
                    className={`transition-opacity duration-150 ${draggingId === task.id ? 'opacity-40' : 'opacity-100'} ${dragOverId === task.id ? 'border-t-2 border-primary-400' : ''}`}
                  >
                    <TaskRow
                      task={task}
                      onSelect={onSelectTask}
                      onStatusChange={onStatusChange}
                      selected={selectedIds?.has(task.id)}
                      onToggleSelect={onToggleSelect}
                    />
                  </div>
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
