import { useMemo, useRef, useState, useEffect } from 'react'
import { PRIORITY_CONFIG } from '../../types'
import type { Task } from '../../types'

interface Props {
  tasks: Task[]
  onSelectTask: (task: Task) => void
}

export function TaskGantt({ tasks, onSelectTask }: Props) {
  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks])
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
          <div className="relative min-w-[600px]">
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
              const left = getPosition(task.start_date)
              const width = getWidth(task.start_date, task.end_date)

              return (
                <div
                  key={task.id}
                  className="relative border-b border-gray-100 dark:border-gray-800 h-10 flex items-center"
                >
                  <div
                    onClick={() => onSelectTask(task)}
                    className={`absolute h-5 rounded cursor-pointer ${BAR_COLORS[task.status]} opacity-80 hover:opacity-100 transition-opacity`}
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: '8px' }}
                    title={`${task.title}\n${task.start_date} → ${task.end_date}`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
