import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTeamStore } from '../store/teamStore'
import { useTaskStore } from '../store/taskStore'
import { useToast } from '../components/ui/Toast'
import { Trash2, RotateCcw } from 'lucide-react'
import { PRIORITY_CONFIG } from '../types'
import type { Task } from '../types'

export function TrashPage() {
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { currentTeam } = useTeamStore()
  const { restoreTask } = useTaskStore()
  const { showToast } = useToast()

  const fetchDeleted = async () => {
    if (!currentTeam) { setLoading(false); return }
    setLoading(true)
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('team_id', currentTeam.id)

    if (!projects?.length) { setDeletedTasks([]); setLoading(false); return }

    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name, emoji)')
      .in('project_id', projects.map((p) => p.id))
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    setDeletedTasks((data as Task[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDeleted()
  }, [currentTeam])

  const handleRestore = async (taskId: string) => {
    const { error } = await restoreTask(taskId)
    if (error) showToast(error, 'error')
    else {
      showToast('Task restored', 'success')
      setDeletedTasks((prev) => prev.filter((t) => t.id !== taskId))
    }
  }

  const handlePermanentDelete = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) showToast(error.message, 'error')
    else {
      showToast('Permanently deleted', 'info')
      setDeletedTasks((prev) => prev.filter((t) => t.id !== taskId))
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-2">
        <Trash2 size={24} className="text-gray-400" />
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Trash</h1>
      </div>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Deleted tasks are kept for 30 days before permanent removal.
      </p>

      {loading && <div className="py-12 text-center text-sm text-gray-400">Loading...</div>}

      {!loading && !deletedTasks.length && (
        <div className="py-12 text-center text-sm text-gray-400">Trash is empty</div>
      )}

      {!loading && deletedTasks.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {deletedTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-800">
              <span className={`h-2 w-2 rounded-full ${PRIORITY_CONFIG[task.priority].dotClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">{task.title}</p>
                <p className="text-xs text-gray-400">
                  {task.project && `${task.project.emoji} ${task.project.name} · `}
                  Deleted {new Date(task.deleted_at!).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleRestore(task.id)}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
              >
                <RotateCcw size={12} />
                Restore
              </button>
              <button
                onClick={() => handlePermanentDelete(task.id)}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
