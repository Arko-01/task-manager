import { useMemo, useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ChevronDown } from 'lucide-react'
import type { Task } from '../../types'

interface Props {
  tasks: Task[]
  onSelectTask: (task: Task) => void
  onDateClick?: (date: string) => void
}

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#9ca3af', // gray
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function TaskCalendar({ tasks, onSelectTask, onDateClick }: Props) {
  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks])
  const calendarRef = useRef<FullCalendar>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const events = useMemo(
    () =>
      rootTasks.map((task) => ({
        id: task.id,
        title: isMobile ? (task.title.length > 12 ? task.title.slice(0, 12) + '...' : task.title) : task.title,
        start: task.start_date,
        end: new Date(new Date(task.end_date).getTime() + 86400000).toISOString().split('T')[0], // FullCalendar end is exclusive
        backgroundColor: PRIORITY_COLORS[task.priority] || '#9ca3af',
        borderColor: 'transparent',
        textColor: '#fff',
        extendedProps: { task },
      })),
    [rootTasks, isMobile]
  )

  const goToMonth = (monthIndex: number) => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    const current = api.getDate()
    const target = new Date(current.getFullYear(), monthIndex, 1)
    api.gotoDate(target)
    setMonthPickerOpen(false)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 task-calendar">
      {/* Month picker dropdown */}
      <div className="relative mb-2 flex justify-end sm:hidden">
        <button
          onClick={() => setMonthPickerOpen(!monthPickerOpen)}
          className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400"
          aria-label="Quick month navigation"
        >
          Jump to month
          <ChevronDown size={12} />
        </button>
        {monthPickerOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 grid grid-cols-3 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {MONTH_NAMES.map((name, i) => (
              <button
                key={name}
                onClick={() => goToMonth(i)}
                className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={isMobile ? 'dayGridWeek' : 'dayGridMonth'}
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        height="auto"
        eventClick={(info) => {
          const task = info.event.extendedProps.task as Task
          onSelectTask(task)
        }}
        dateClick={onDateClick ? (info) => onDateClick(info.dateStr) : undefined}
        eventDisplay="block"
        dayMaxEvents={isMobile ? 2 : 3}
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: true }}
        displayEventTime={!isMobile}
      />
    </div>
  )
}
