import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { PRIORITY_CONFIG } from '../../types'
import type { Task } from '../../types'

interface Props {
  tasks: Task[]
  onSelectTask: (task: Task) => void
  onUpdateTask?: (taskId: string, data: { start_date: string; end_date: string }) => void
}

interface DragState {
  taskId: string
  mode: 'move' | 'resize-start' | 'resize-end'
  startX: number
  originalStart: string
  originalEnd: string
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10)
}

export function TaskGantt({ tasks, onSelectTask, onUpdateTask }: Props) {
  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks])
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const dragDidMove = useRef(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // --- Drag handlers ---
  const getTimelineWidth = useCallback(() => {
    const el = containerRef.current?.querySelector('.gantt-timeline') as HTMLElement | null
    return el?.clientWidth || 600
  }, [])

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, taskId: string, mode: DragState['mode']) => {
      if (!onUpdateTask) return
      const task = rootTasks.find((t) => t.id === taskId)
      if (!task) return
      e.stopPropagation()
      e.preventDefault()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      dragDidMove.current = false
      setDragState({
        taskId,
        mode,
        startX: clientX,
        originalStart: formatDate(task.start_date),
        originalEnd: formatDate(task.end_date),
      })
      setDragOffset(0)
    },
    [onUpdateTask, rootTasks]
  )

  useEffect(() => {
    if (!dragState) return

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const dx = clientX - dragState.startX
      if (Math.abs(dx) > 3) dragDidMove.current = true
      setDragOffset(dx)
    }

    const handleEnd = () => {
      if (dragDidMove.current && onUpdateTask) {
        const containerWidth = getTimelineWidth()
        const dayOffset = Math.round((dragOffset / containerWidth) * totalDays)

        if (dayOffset !== 0) {
          let newStart: string
          let newEnd: string

          if (dragState.mode === 'move') {
            newStart = addDays(dragState.originalStart, dayOffset)
            newEnd = addDays(dragState.originalEnd, dayOffset)
          } else if (dragState.mode === 'resize-start') {
            newStart = addDays(dragState.originalStart, dayOffset)
            newEnd = dragState.originalEnd
            // Enforce min 1 day
            if (new Date(newStart) >= new Date(newEnd)) {
              newStart = addDays(newEnd, -1)
            }
          } else {
            newStart = dragState.originalStart
            newEnd = addDays(dragState.originalEnd, dayOffset)
            // Enforce min 1 day
            if (new Date(newEnd) <= new Date(newStart)) {
              newEnd = addDays(newStart, 1)
            }
          }

          onUpdateTask(dragState.taskId, { start_date: newStart, end_date: newEnd })
        }
      }
      setDragState(null)
      setDragOffset(0)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
    // dragOffset is intentionally read from closure at handleEnd time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState, dragOffset, onUpdateTask, getTimelineWidth])

  // Compute drag preview position for the active bar
  const getDragPreview = useCallback(
    (taskId: string) => {
      if (!dragState || dragState.taskId !== taskId || !dragDidMove.current) return null
      const containerWidth = getTimelineWidth()
      const dayOffset = Math.round((dragOffset / containerWidth) * totalDaysRef.current)

      let newStart: string
      let newEnd: string

      if (dragState.mode === 'move') {
        newStart = addDays(dragState.originalStart, dayOffset)
        newEnd = addDays(dragState.originalEnd, dayOffset)
      } else if (dragState.mode === 'resize-start') {
        newStart = addDays(dragState.originalStart, dayOffset)
        newEnd = dragState.originalEnd
        if (new Date(newStart) >= new Date(newEnd)) newStart = addDays(newEnd, -1)
      } else {
        newStart = dragState.originalStart
        newEnd = addDays(dragState.originalEnd, dayOffset)
        if (new Date(newEnd) <= new Date(newStart)) newEnd = addDays(newStart, 1)
      }

      return { start: newStart, end: newEnd }
    },
    [dragState, dragOffset, getTimelineWidth]
  )

  // We need totalDays available for the drag handlers, so store in a ref
  const totalDaysRef = useRef(14)

  // Calculate date range
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (!rootTasks.length) {
      const now = new Date()
      const min = new Date(now.getFullYear(), now.getMonth(), 1)
      const max = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      return { minDate: min, maxDate: max, totalDays: Math.ceil((max.getTime() - min.getTime()) / 86400000) }
    }
    const starts = rootTasks.map((t) => new Date(t.start_date).getTime())
    const ends = rootTasks.map((t) => new Date(t.end_date).getTime())
    const min = new Date(Math.min(...starts))
    const max = new Date(Math.max(...ends))
    // Add padding
    min.setDate(min.getDate() - 3)
    max.setDate(max.getDate() + 7)
    const total = Math.ceil((max.getTime() - min.getTime()) / 86400000)
    return { minDate: min, maxDate: max, totalDays: Math.max(total, 14) }
  }, [rootTasks])

  // Keep ref in sync for drag handlers
  totalDaysRef.current = totalDays

  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = (date.getTime() - minDate.getTime()) / 86400000
    return (diff / totalDays) * 100
  }

  const getWidth = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const diff = (e.getTime() - s.getTime()) / 86400000 + 1
    return Math.max((diff / totalDays) * 100, 1)
  }

  // Generate month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; left: number }[] = []
    const current = new Date(minDate)
    current.setDate(1)
    if (current < minDate) current.setMonth(current.getMonth() + 1)
    while (current <= maxDate) {
      const left = ((current.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100
      labels.push({
        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        left: Math.max(left, 0),
      })
      current.setMonth(current.getMonth() + 1)
    }
    return labels
  }, [minDate, maxDate, totalDays])

  const today = new Date()
  const todayPos = ((today.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100

  const BAR_COLORS: Record<string, string> = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    on_hold: 'bg-amber-500',
    done: 'bg-green-500',
  }

  if (!rootTasks.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-400 dark:text-gray-500">No tasks to display on Gantt chart</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="flex">
        {/* Left: Task names */}
        <div className={`${isMobile ? 'w-32' : 'w-56'} shrink-0 border-r border-gray-200 dark:border-gray-800`}>
          <div className="h-8 border-b border-gray-200 bg-gray-50 px-3 flex items-center dark:border-gray-800 dark:bg-gray-800/50">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Task</span>
          </div>
          {rootTasks.map((task) => {
            const displayTitle = isMobile && task.title.length > 14
              ? task.title.slice(0, 14) + '...'
              : task.title
            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 h-10"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_CONFIG[task.priority].dotClass}`} />
                <span className="truncate text-sm text-gray-700 dark:text-gray-300" title={task.title}>{displayTitle}</span>
              </div>
            )
          })}
        </div>

        {/* Right: Timeline */}
        <div className="relative flex-1 overflow-x-auto touch-pan-x" ref={containerRef}>
          {/* Horizontal scroll hint gradient (mobile) */}
          {isMobile && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-l from-white dark:from-gray-900" />
          )}
          <div className={`relative min-w-[600px] gantt-timeline ${dragState ? 'cursor-grabbing select-none' : ''}`}>
            {/* Month headers */}
            <div className="h-8 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50 relative">
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
                  style={{ left: `${m.left}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Today line */}
            {todayPos >= 0 && todayPos <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                style={{ left: `${todayPos}%` }}
              >
                <span className="absolute -top-0 -translate-x-1/2 rounded bg-red-500 px-1 py-0.5 text-[10px] text-white">
                  Today
                </span>
              </div>
            )}

            {/* Dependency arrows (SVG overlay) */}
            <svg className="absolute inset-0 pointer-events-none" style={{ top: '32px', height: `${rootTasks.length * 40}px` }}>
              {rootTasks.flatMap((task, fromIdx) =>
                (task.dependencies || []).map((dep) => {
                  const toIdx = rootTasks.findIndex((t) => t.id === dep.depends_on_task_id)
                  if (toIdx === -1) return null
                  const depTask = rootTasks[toIdx]
                  const fromX = getPosition(task.start_date)
                  const toX = getPosition(depTask.end_date) + getWidth(depTask.start_date, depTask.end_date)
                  const fromY = fromIdx * 40 + 20
                  const toY = toIdx * 40 + 20
                  return (
                    <g key={dep.id}>
                      <line
                        x1={`${toX}%`} y1={toY}
                        x2={`${fromX}%`} y2={fromY}
                        stroke="currentColor" strokeWidth="1.5"
                        className="text-gray-400 dark:text-gray-500"
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  )
                })
              )}
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" className="fill-gray-400 dark:fill-gray-500" />
                </marker>
              </defs>
            </svg>

            {/* Bars */}
            {rootTasks.map((task) => {
              const isDragging = dragState?.taskId === task.id
              const preview = isDragging ? getDragPreview(task.id) : null
              const displayStart = preview ? preview.start : task.start_date
              const displayEnd = preview ? preview.end : task.end_date
              const left = getPosition(displayStart)
              const width = getWidth(displayStart, displayEnd)

              return (
                <div
                  key={task.id}
                  className="relative border-b border-gray-100 dark:border-gray-800 h-10 flex items-center"
                >
                  {/* Ghost bar showing original position while dragging */}
                  {isDragging && preview && (
                    <div
                      className={`absolute h-5 rounded ${BAR_COLORS[task.status]} opacity-25`}
                      style={{
                        left: `${getPosition(task.start_date)}%`,
                        width: `${getWidth(task.start_date, task.end_date)}%`,
                        minWidth: '8px',
                      }}
                    />
                  )}
                  {/* Main bar */}
                  <div
                    onClick={() => {
                      if (!dragDidMove.current) onSelectTask(task)
                    }}
                    onMouseDown={(e) => handleDragStart(e, task.id, 'move')}
                    onTouchStart={(e) => handleDragStart(e, task.id, 'move')}
                    className={`group absolute h-5 rounded ${isDragging ? 'cursor-grabbing' : onUpdateTask ? 'cursor-grab' : 'cursor-pointer'} ${BAR_COLORS[task.status]} ${isDragging && preview ? 'opacity-90' : 'opacity-80'} hover:opacity-100 transition-opacity`}
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: '8px' }}
                    title={`${task.title}\n${displayStart} → ${displayEnd}`}
                  >
                    {/* Left resize handle */}
                    {onUpdateTask && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 bg-black/20 rounded-l transition-opacity"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          handleDragStart(e, task.id, 'resize-start')
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation()
                          handleDragStart(e, task.id, 'resize-start')
                        }}
                      />
                    )}
                    {/* Right resize handle */}
                    {onUpdateTask && (
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 bg-black/20 rounded-r transition-opacity"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          handleDragStart(e, task.id, 'resize-end')
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation()
                          handleDragStart(e, task.id, 'resize-end')
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
