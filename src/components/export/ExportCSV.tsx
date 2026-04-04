import { Button } from '../ui/Button'
import { Download } from 'lucide-react'
import type { Task } from '../../types'

interface ExportCSVProps {
  tasks: Task[]
  filename?: string
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  done: 'Done',
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
}

export function ExportCSV({ tasks, filename = 'tasks' }: ExportCSVProps) {
  const handleExport = () => {
    const headers = ['Title', 'Status', 'Priority', 'Type', 'Assignees', 'Due Date', 'Tags', 'Description', 'Time Spent']
    const rows = tasks.map((task) => [
      escapeCSV(task.title),
      escapeCSV(STATUS_LABELS[task.status] || task.status),
      escapeCSV(PRIORITY_LABELS[task.priority] || String(task.priority)),
      escapeCSV(task.task_type),
      escapeCSV(task.assignees?.map((a) => a.profile?.full_name || a.user_id).join('; ') || ''),
      escapeCSV(task.end_date || ''),
      escapeCSV(task.tags?.join('; ') || ''),
      escapeCSV(task.description || ''),
      escapeCSV(task.time_spent_days ? `${task.time_spent_days}d` : ''),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleExport}>
      <Download size={14} className="mr-1.5" />
      CSV
    </Button>
  )
}
