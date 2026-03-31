import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTeamStore } from '../../store/teamStore'
import { useTaskStore } from '../../store/taskStore'
import { Avatar } from '../ui/Avatar'
import { useToast } from '../ui/Toast'
import type { TaskAssignee } from '../../types'

interface Props {
  taskId: string
  assignees: TaskAssignee[]
  readOnly?: boolean
}

export function AssigneeSelector({ taskId, assignees, readOnly }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const { members } = useTeamStore()
  const { addAssignee, removeAssignee, updateAssigneeRole } = useTaskStore()
  const { showToast } = useToast()

  const assignedIds = new Set(assignees.map((a) => a.user_id))
  const available = members.filter((m) => !assignedIds.has(m.user_id))

  const handleAdd = async (userId: string, role: 'primary' | 'secondary') => {
    const { error } = await addAssignee(taskId, userId, role)
    if (error) showToast(error, 'error')
    setShowPicker(false)
  }

  const handleRemove = async (userId: string) => {
    const { error } = await removeAssignee(taskId, userId)
    if (error) showToast(error, 'error')
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'primary' ? 'secondary' : 'primary'
    const { error } = await updateAssigneeRole(taskId, userId, newRole)
    if (error) showToast(error, 'error')
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Assignees
        </label>
        {!readOnly && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Current assignees */}
      <div className="space-y-1">
        {assignees.map((a) => (
          <div key={a.user_id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Avatar name={a.profile?.full_name} url={a.profile?.avatar_url} size="sm" />
            <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
              {a.profile?.full_name || 'Unknown'}
            </span>
            <span
              onClick={!readOnly ? () => handleToggleRole(a.user_id, a.role) : undefined}
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                a.role === 'primary'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              } ${!readOnly ? 'cursor-pointer' : ''}`}
            >
              {a.role === 'primary' ? 'P' : 'S'}
            </span>
            {!readOnly && (
              <button
                onClick={() => handleRemove(a.user_id)}
                aria-label={`Remove ${a.profile?.full_name || 'assignee'}`}
                className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Picker dropdown */}
      {showPicker && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
          <div className="relative z-20 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {available.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">All members are assigned</p>
            ) : (
              available.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Avatar name={m.profile?.full_name} url={m.profile?.avatar_url} size="sm" />
                  <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                    {m.profile?.full_name || m.profile?.email}
                  </span>
                  <button
                    onClick={() => handleAdd(m.user_id, 'primary')}
                    className="rounded px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300"
                  >
                    Primary
                  </button>
                  <button
                    onClick={() => handleAdd(m.user_id, 'secondary')}
                    className="rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                  >
                    Secondary
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
