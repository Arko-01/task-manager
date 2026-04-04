import { Button } from '../ui/Button'
import { FileText } from 'lucide-react'
import type { Task } from '../../types'
import jsPDF from 'jspdf'

interface ExportPDFProps {
  tasks: Task[]
  projectName: string
  progress: number
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

export function ExportPDF({ tasks, projectName, progress }: ExportPDFProps) {
  const handleExport = () => {
    const doc = new jsPDF()

    // Page 1: Project Summary
    doc.setFontSize(20)
    doc.text(projectName, 20, 30)

    doc.setFontSize(12)
    doc.text(`Progress: ${progress}%`, 20, 45)

    const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    }, {})

    let y = 60
    doc.setFontSize(14)
    doc.text('Task Counts by Status', 20, y)
    y += 10
    doc.setFontSize(11)
    for (const [status, count] of Object.entries(statusCounts)) {
      doc.text(`${STATUS_LABELS[status] || status}: ${count}`, 25, y)
      y += 8
    }

    doc.text(`Total Tasks: ${tasks.length}`, 25, y + 5)

    // Page 2+: Task List
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Task List', 20, 20)

    // Table header
    const colX = [20, 90, 130, 160]
    y = 35
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Title', colX[0], y)
    doc.text('Status', colX[1], y)
    doc.text('Priority', colX[2], y)
    doc.text('Due Date', colX[3], y)
    y += 3
    doc.setLineWidth(0.3)
    doc.line(20, y, 190, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    for (const task of tasks) {
      if (y > 275) {
        doc.addPage()
        y = 20
      }
      const title = task.title.length > 35 ? task.title.slice(0, 35) + '...' : task.title
      doc.text(title, colX[0], y)
      doc.text(STATUS_LABELS[task.status] || task.status, colX[1], y)
      doc.text(PRIORITY_LABELS[task.priority] || String(task.priority), colX[2], y)
      doc.text(task.end_date || '-', colX[3], y)
      y += 7
    }

    doc.save(`${projectName.replace(/\s+/g, '_')}_report.pdf`)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleExport}>
      <FileText size={14} className="mr-1.5" />
      PDF
    </Button>
  )
}
