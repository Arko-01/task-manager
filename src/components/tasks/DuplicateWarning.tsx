import { AlertTriangle, X } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { STATUS_CONFIG } from '../../types'
import type { TaskStatus } from '../../types'
import { Badge } from '../ui/Badge'

interface Props {
  title: string
  projectId: string
  onDismiss: () => void
}

export function DuplicateWarning({ title, projectId, onDismiss }: Props) {
  const findSimilarTasks = useTaskStore((s) => s.findSimilarTasks)
  const matches = findSimilarTasks(title, projectId)

  if (!matches.length) return null

  const displayed = matches.slice(0, 3)

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Similar tasks found:
            </p>
            <ul className="space-y-1">
              {displayed.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status as TaskStatus] ?? STATUS_CONFIG.todo
                return (
                  <li key={task.id} className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <span className="truncate">{task.title}</span>
                    <Badge className={statusCfg.badgeClass}>{statusCfg.label}</Badge>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-yellow-500 hover:bg-yellow-100 hover:text-yellow-700 dark:hover:bg-yellow-900/40 dark:hover:text-yellow-300"
          aria-label="Dismiss warning"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
