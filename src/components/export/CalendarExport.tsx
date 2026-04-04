import { Button } from '../ui/Button'
import { Calendar } from 'lucide-react'
import type { Task } from '../../types'

interface CalendarExportProps {
  tasks: Task[]
}

function formatICalDate(dateStr: string): string {
  // Convert YYYY-MM-DD to YYYYMMDD (all-day event format)
  return dateStr.replace(/-/g, '')
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function CalendarExport({ tasks }: CalendarExportProps) {
  const handleExport = () => {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Task Manager//EN',
      'CALSCALE:GREGORIAN',
    ]

    for (const task of tasks) {
      if (!task.start_date && !task.end_date) continue

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${task.id}@taskmanager`)
      lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`)

      if (task.start_date) {
        lines.push(`DTSTART;VALUE=DATE:${formatICalDate(task.start_date)}`)
      }
      if (task.end_date) {
        // iCal DTEND for all-day events is exclusive, so add one day
        const endDate = new Date(task.end_date)
        endDate.setDate(endDate.getDate() + 1)
        const endStr = endDate.toISOString().split('T')[0]
        lines.push(`DTEND;VALUE=DATE:${formatICalDate(endStr)}`)
      }

      lines.push(`SUMMARY:${escapeICalText(task.title)}`)
      if (task.description) {
        lines.push(`DESCRIPTION:${escapeICalText(task.description)}`)
      }
      lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')

    const content = lines.join('\r\n')
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tasks.ics'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleExport}>
      <Calendar size={14} className="mr-1.5" />
      Calendar
    </Button>
  )
}
