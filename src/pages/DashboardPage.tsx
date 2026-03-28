import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
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

export function DashboardPage() {
  const { profile } = useAuthStore()
  const { tasks, loading, fetchMyTasks, updateTask, setCurrentTask, currentTask, filters } = useTaskStore()
  const [view, setView] = useState<ViewType>('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchMyTasks()
  }, [fetchMyTasks, filters])

  const handleSelectTask = useCallback((task: Task) => {
    setCurrentTask(task)
  }, [setCurrentTask])

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status })
    fetchMyTasks()
  }, [updateTask, fetchMyTasks])

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }, [])

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">My Tasks</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back, {profile?.full_name || 'there'}
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ViewToggle current={view} onChange={setView} />
        <TaskFilters showResponsibility />
      </div>

      {/* Quick add */}
      <div className="mb-4">
        <QuickAddTask onCreated={fetchMyTasks} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-sm text-gray-400">Loading tasks...</div>
      )}

      {/* Views */}
      {!loading && (
        <>
          {view === 'list' && (
            <TaskList
              tasks={tasks}
              onSelectTask={handleSelectTask}
              onStatusChange={handleStatusChange}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          )}
          {view === 'board' && (
            <TaskBoard
              tasks={tasks}
              onSelectTask={handleSelectTask}
              onStatusChange={handleStatusChange}
            />
          )}
          {view === 'calendar' && (
            <TaskCalendar tasks={tasks} onSelectTask={handleSelectTask} />
          )}
          {view === 'gantt' && (
            <TaskGantt tasks={tasks} onSelectTask={handleSelectTask} />
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !tasks.length && (
        <div className="mt-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">No tasks yet</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first task or join a team to get started.
          </p>
        </div>
      )}

      {/* Task Detail Panel */}
      {currentTask && (
        <TaskDetail task={currentTask} onClose={() => setCurrentTask(null)} />
      )}

      {/* Bulk Actions */}
      <BulkActions selectedIds={selectedIds} onClear={() => setSelectedIds(new Set())} />
    </div>
  )
}
