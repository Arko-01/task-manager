import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import type { Task } from '../../types'

interface Props {
  tasks: Task[]
  onSelectTask: (task: Task) => void
}

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#9ca3af', // gray
}

export function TaskCalendar({ tasks, onSelectTask }: Props) {
  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks])

  const events = useMemo(
    () =>
      rootTasks.map((task) => ({
        id: task.id,
        title: task.title,
        start: task.start_date,
        end: new Date(new Date(task.end_date).getTime() + 86400000).toISOString().split('T')[0], // FullCalendar end is exclusive
        backgroundColor: PRIORITY_COLORS[task.priority] || '#9ca3af',
        borderColor: 'transparent',
        textColor: '#fff',
        extendedProps: { task },
      })),
    [rootTasks]
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 task-calendar">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
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
        eventDisplay="block"
        dayMaxEvents={3}
      />
    </div>
  )
}
