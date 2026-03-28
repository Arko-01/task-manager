import { useEffect, useState, useCallback } from 'react'
import { useTeamStore } from '../store/teamStore'
import { useTaskStore } from '../store/taskStore'
import { ViewToggle } from '../components/tasks/ViewToggle'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskList } from '../components/tasks/TaskList'
import { TaskBoard } from '../components/tasks/TaskBoard'
import { TaskCalendar } from '../components/tasks/TaskCalendar'
import { TaskGantt } from '../components/tasks/TaskGantt'
import { TaskDetail } from '../components/tasks/TaskDetail'
import { BulkActions } from '../components/tasks/BulkActions'
import { QuickAddTask } from '../components/tasks/QuickAddTask'
import type { ViewType, Task, TaskStatus } from '../types'

export function TeamDashboardPage() {
  const { currentTeam, members } = useTeamStore()
  const { tasks, loading, fetchTeamTasks, updateTask, setCurrentTask, currentTask, filters } = useTaskStore()
  const [view, setView] = useState<ViewType>('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (currentTeam) fetchTeamTasks(currentTeam.id)
  }, [currentTeam, fetchTeamTasks, filters])

  const handleSelectTask = useCallback((task: Task) => setCurrentTask(task), [setCurrentTask])

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status })
    if (currentTeam) fetchTeamTasks(currentTeam.id)
  }, [updateTask, fetchTeamTasks, currentTeam])

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }, [])

  const assigneeOptions = members.map((m) => ({
    id: m.user_id,
    name: m.profile?.full_name || m.profile?.email || 'Unknown',
  }))

  // Stats
  const totalTasks = tasks.length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const overdue = tasks.filter((t) => new Date(t.end_date) < new Date() && t.status !== 'done').length
  const doneThisWeek = tasks.filter((t) => {
    if (t.status !== 'done') return false
    const updated = new Date(t.updated_at)
    const weekAgo = new Date(Date.now() - 7 * 86400000)
    return updated >= weekAgo
  }).length

  if (!currentTeam) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">Please create or select a team first.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {currentTeam.name} Dashboard
        </h1>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: totalTasks, color: 'text-gray-900 dark:text-gray-100' },
          { label: 'In Progress', value: inProgress, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Overdue', value: overdue, color: 'text-red-600 dark:text-red-400' },
          { label: 'Done This Week', value: doneThisWeek, color: 'text-green-600 dark:text-green-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ViewToggle current={view} onChange={setView} />
        <TaskFilters showAssignee assigneeOptions={assigneeOptions} />
      </div>

      {/* Quick add */}
      <div className="mb-4">
        <QuickAddTask onCreated={() => fetchTeamTasks(currentTeam.id)} />
      </div>

      {loading && <div className="py-12 text-center text-sm text-gray-400">Loading tasks...</div>}

      {!loading && (
        <>
          {view === 'list' && (
            <TaskList tasks={tasks} onSelectTask={handleSelectTask} onStatusChange={handleStatusChange} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
          )}
          {view === 'board' && (
            <TaskBoard tasks={tasks} onSelectTask={handleSelectTask} onStatusChange={handleStatusChange} />
          )}
          {view === 'calendar' && <TaskCalendar tasks={tasks} onSelectTask={handleSelectTask} />}
          {view === 'gantt' && <TaskGantt tasks={tasks} onSelectTask={handleSelectTask} />}
        </>
      )}

      {!loading && !tasks.length && (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">No tasks in this team yet.</p>
        </div>
      )}

      {currentTask && <TaskDetail task={currentTask} onClose={() => setCurrentTask(null)} />}
      <BulkActions selectedIds={selectedIds} onClear={() => setSelectedIds(new Set())} />
    </div>
  )
}
