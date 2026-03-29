import { useState, useEffect } from 'react'
import { X, Copy, Trash2 } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useToast } from '../ui/Toast'
import { Badge } from '../ui/Badge'
import { AssigneeSelector } from './AssigneeSelector'
import { DependencySelector } from './DependencySelector'
import { RecurrenceSelector } from './RecurrenceSelector'
import { CommentList } from './CommentList'
import { QuickAddTask } from './QuickAddTask'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types'
import type { Task, TaskStatus, TaskPriority } from '../../types'

interface Props {
  task: Task
  onClose: () => void
}

export function TaskDetail({ task, onClose }: Props) {
  const { updateTask, deleteTask, duplicateTask } = useTaskStore()
  const { showToast } = useToast()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority)
  const [startDate, setStartDate] = useState(task.start_date)
  const [endDate, setEndDate] = useState(task.end_date)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setStatus(task.status)
    setPriority(task.priority)
    setStartDate(task.start_date)
    setEndDate(task.end_date)
  }, [task])

  const save = async (data: Partial<Task>) => {
    const { error } = await updateTask(task.id, data)
    if (error) showToast(error, 'error')
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) save({ title: title.trim() })
  }

  const handleDescBlur = () => {
    if (description !== (task.description || '')) save({ description: description || null })
  }

  const handleDelete = async () => {
    const { error } = await deleteTask(task.id)
    if (error) showToast(error, 'error')
    else { showToast('Task moved to trash', 'info'); onClose() }
  }

  const handleDuplicate = async () => {
    const { error } = await duplicateTask(task.id)
    if (error) showToast(error, 'error')
    else showToast('Task duplicated', 'success')
  }

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full max-w-md border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {task.project && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {task.project.emoji} {task.project.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleDuplicate} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800" title="Duplicate">
            <Copy size={16} />
          </button>
          <button onClick={handleDelete} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" title="Delete">
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full text-lg font-semibold text-gray-900 bg-transparent focus:outline-none dark:text-gray-100"
        />

        {/* Status & Priority row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as TaskStatus); save({ status: e.target.value as TaskStatus }) }}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Priority</label>
            <select
              value={priority}
              onChange={(e) => { const p = Number(e.target.value) as TaskPriority; setPriority(p); save({ priority: p }) }}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const newStart = e.target.value
                setStartDate(newStart)
                if (endDate && newStart > endDate) {
                  setEndDate(newStart)
                  save({ start_date: newStart, end_date: newStart })
                } else {
                  save({ start_date: newStart })
                }
              }}
              max={endDate || undefined}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); save({ end_date: e.target.value }) }}
              min={startDate || undefined}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="Add a description..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Assignees */}
        <AssigneeSelector taskId={task.id} assignees={task.assignees || []} />

        {/* Recurrence */}
        <RecurrenceSelector
          isRecurring={task.is_recurring}
          pattern={task.recurrence_pattern}
          onChange={(isRecurring, recurrence_pattern) => save({ is_recurring: isRecurring, recurrence_pattern })}
        />

        {/* Dependencies */}
        <DependencySelector taskId={task.id} dependencies={task.dependencies || []} />

        {/* Sub-tasks */}
        {task.depth < 2 && (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Sub-tasks
            </label>
            {task.sub_tasks?.map((st) => (
              <div key={st.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-300">
                <span className={`h-2 w-2 rounded-full ${PRIORITY_CONFIG[st.priority].dotClass}`} />
                <Badge className={STATUS_CONFIG[st.status].badgeClass}>{STATUS_CONFIG[st.status].label}</Badge>
                <span className={st.status === 'done' ? 'line-through text-gray-400' : ''}>{st.title}</span>
              </div>
            ))}
            <QuickAddTask projectId={task.project_id} parentId={task.id} />
          </div>
        )}

        {/* Comments */}
        <CommentList taskId={task.id} />
      </div>
    </div>
  )
}
