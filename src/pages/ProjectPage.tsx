import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { useTaskStore } from '../store/taskStore'
import { useTeamStore } from '../store/teamStore'
import { ViewToggle } from '../components/tasks/ViewToggle'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskList } from '../components/tasks/TaskList'
import { TaskBoard } from '../components/tasks/TaskBoard'
import { TaskCalendar } from '../components/tasks/TaskCalendar'
import { TaskGantt } from '../components/tasks/TaskGantt'
import { TaskDetail } from '../components/tasks/TaskDetail'
import { BulkActions } from '../components/tasks/BulkActions'
import { TaskTemplates } from '../components/tasks/TaskTemplates'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Badge } from '../components/ui/Badge'
import { TaskListSkeleton, TaskBoardSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/Toast'
import type { ViewType, Task, TaskStatus, ProjectStatus } from '../types'

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; class: string }> = {
  not_started: { label: 'Not Started', class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  on_hold: { label: 'On Hold', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  completed: { label: 'Completed', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  overdue: { label: 'Overdue', class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects, getProjectStatus } = useProjectStore()
  const { tasks, loading, fetchTasks, updateTask, createTask, setCurrentTask, currentTask, filters } = useTaskStore()
  const { members } = useTeamStore()
  const [view, setView] = useState<ViewType>('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [calendarDate, setCalendarDate] = useState<string | null>(null)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [projectStatus, setProjectStatus] = useState<{ status: ProjectStatus; progress: number }>({
    status: 'not_started',
    progress: 0,
  })

  const { showToast } = useToast()

  const project = projects.find((p) => p.id === projectId)

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId)
      getProjectStatus(projectId).then(setProjectStatus)
    }
  }, [projectId, fetchTasks, getProjectStatus, filters])

  useEffect(() => {
    const handler = (e: Event) => setView((e as CustomEvent).detail)
    window.addEventListener('switch-view', handler)
    return () => window.removeEventListener('switch-view', handler)
  }, [])

  const handleSelectTask = useCallback((task: Task) => setCurrentTask(task), [setCurrentTask])

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status })
    if (projectId) {
      fetchTasks(projectId)
      getProjectStatus(projectId).then(setProjectStatus)
    }
  }, [updateTask, fetchTasks, projectId, getProjectStatus])

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

  if (!project) {
    return <div className="py-12 text-center text-sm text-gray-400">Project not found</div>
  }

  const statusConfig = PROJECT_STATUS_CONFIG[projectStatus.status]

  return (
    <div className="max-w-6xl">
      {/* Project header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{project.emoji || '📁'}</span>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{project.name}</h1>
            {project.description && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
            )}
          </div>
          <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={projectStatus.progress} className="max-w-xs" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{projectStatus.progress}%</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {project.start_date} — {project.end_date}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ViewToggle current={view} onChange={setView} />
          {projectId && <TaskTemplates projectId={projectId} onCreated={() => fetchTasks(projectId)} />}
        </div>
        <TaskFilters showAssignee assigneeOptions={assigneeOptions} />
      </div>

      {loading && (view === 'list' || view === 'calendar' || view === 'gantt' ? <TaskListSkeleton /> : <TaskBoardSkeleton />)}

      {!loading && (
        <>
          {view === 'list' && (
            <TaskList tasks={tasks} projectId={projectId} onSelectTask={handleSelectTask} onStatusChange={handleStatusChange} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
          )}
          {view === 'board' && (
            <TaskBoard tasks={tasks} projectId={projectId} onSelectTask={handleSelectTask} onStatusChange={handleStatusChange} />
          )}
          {view === 'calendar' && (
            <>
              <TaskCalendar tasks={tasks} onSelectTask={handleSelectTask} onDateClick={(date) => setCalendarDate(date)} />
              {calendarDate && projectId && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-800 dark:bg-primary-900/20">
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">New task on {calendarDate}:</span>
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    if (!calendarTitle.trim()) return
                    const { error } = await createTask({
                      project_id: projectId,
                      title: calendarTitle.trim(),
                      start_date: calendarDate,
                      end_date: calendarDate,
                    })
                    if (error) { showToast(error, 'error') } else {
                      setCalendarTitle('')
                      setCalendarDate(null)
                      fetchTasks(projectId)
                    }
                  }} className="flex flex-1 gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={calendarTitle}
                      onChange={(e) => setCalendarTitle(e.target.value)}
                      placeholder="Task title..."
                      className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:border-primary-500"
                    />
                    <button type="submit" className="rounded bg-primary-500 px-3 py-1 text-xs font-medium text-white hover:bg-primary-600">Add</button>
                    <button type="button" onClick={() => { setCalendarDate(null); setCalendarTitle('') }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
                  </form>
                </div>
              )}
            </>
          )}
          {view === 'gantt' && <TaskGantt tasks={tasks} onSelectTask={handleSelectTask} />}
        </>
      )}

      {currentTask && <TaskDetail task={currentTask} onClose={() => setCurrentTask(null)} />}
      <BulkActions selectedIds={selectedIds} onClear={() => setSelectedIds(new Set())} />
    </div>
  )
}
