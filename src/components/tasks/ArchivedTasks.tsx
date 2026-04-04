import { useState, useEffect } from 'react'
import { useTaskStore } from '../../store/taskStore'
import { Button } from '../ui/Button'
import { ArchiveRestore } from 'lucide-react'
import type { Task } from '../../types'

interface ArchivedTasksProps {
  projectId: string
}

export function ArchivedTasks({ projectId }: ArchivedTasksProps) {
  const { fetchArchivedTasks, updateTask } = useTaskStore()
  const [archived, setArchived] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await fetchArchivedTasks(projectId)
    setArchived(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleRestore = async (taskId: string) => {
    await updateTask(taskId, { archived_at: null })
    setArchived((prev) => prev.filter((t) => t.id !== taskId))
  }

  if (loading) {
    return <p className="py-4 text-center text-sm text-gray-400">Loading archived tasks...</p>
  }

  if (!archived.length) {
    return <p className="py-8 text-center text-sm text-gray-400">No archived tasks</p>
  }

  return (
    <div className="space-y-2">
      {archived.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
            {task.archived_at && (
              <p className="text-xs text-gray-400">
                Archived {new Date(task.archived_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleRestore(task.id)}>
            <ArchiveRestore size={14} className="mr-1" />
            Restore
          </Button>
        </div>
      ))}
    </div>
  )
}
