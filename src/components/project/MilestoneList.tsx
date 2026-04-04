import { useState } from 'react'
import { Trash2, Plus, Calendar } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { ProgressBar } from '../ui/ProgressBar'
import { useToast } from '../ui/Toast'
import type { Milestone, Task } from '../../types'

interface Props {
  projectId: string
  milestones: Milestone[]
  tasks: Task[]
  canEdit: boolean
}

export function MilestoneList({ projectId, milestones, tasks, canEdit }: Props) {
  const { createMilestone, updateMilestone, deleteMilestone } = useProjectStore()
  const { showToast } = useToast()
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')

  const getProgress = (milestoneId: string) => {
    const milestoneTasks = tasks.filter((t) => t.milestone_id === milestoneId)
    if (!milestoneTasks.length) return { done: 0, total: 0, percent: 0 }
    const done = milestoneTasks.filter((t) => t.status === 'done').length
    return { done, total: milestoneTasks.length, percent: Math.round((done / milestoneTasks.length) * 100) }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    const { error } = await createMilestone(projectId, newName.trim(), newDate || undefined)
    if (error) showToast(error, 'error')
    else { setNewName(''); setNewDate(''); setShowAdd(false) }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteMilestone(id)
    if (error) showToast(error, 'error')
  }

  const startEdit = (m: Milestone) => {
    setEditingId(m.id)
    setEditName(m.name)
    setEditDate(m.target_date || '')
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    const { error } = await updateMilestone(editingId, {
      name: editName.trim(),
      target_date: editDate || null,
    })
    if (error) showToast(error, 'error')
    setEditingId(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Milestones
        </h3>
        {canEdit && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Add milestone"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {milestones.length === 0 && !showAdd && (
        <p className="text-xs text-gray-400 dark:text-gray-500">No milestones yet</p>
      )}

      {milestones.map((m) => {
        const progress = getProgress(m.id)
        const isEditing = editingId === m.id

        return (
          <div
            key={m.id}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
          >
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  autoFocus
                  className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:border-primary-500"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:border-primary-500"
                  />
                  <button onClick={saveEdit} className="rounded bg-primary-500 px-2 py-1 text-xs text-white hover:bg-primary-600">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${canEdit ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400' : ''}`}
                    onClick={() => canEdit && startEdit(m)}
                  >
                    {m.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {m.target_date && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Calendar size={10} />
                        {m.target_date}
                      </span>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={progress.percent} className="flex-1" />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
                    {progress.done}/{progress.total}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {showAdd && canEdit && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800/50 space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Milestone name..."
            autoFocus
            className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:border-primary-500"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:border-primary-500"
            />
            <button onClick={handleAdd} disabled={!newName.trim()} className="rounded bg-primary-500 px-2 py-1 text-xs text-white hover:bg-primary-600 disabled:opacity-50">Add</button>
            <button onClick={() => { setShowAdd(false); setNewName(''); setNewDate('') }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
