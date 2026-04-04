import { useState } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import { STATUS_CONFIG } from '../../types'
import type { TaskStatus } from '../../types'
import { Button } from '../ui/Button'

interface Props {
  statuses: string[]
  onChange: (statuses: string[]) => void
}

const DEFAULT_STATUS_KEYS = Object.keys(STATUS_CONFIG) as TaskStatus[]

function getStatusDotColor(status: string): string {
  if (status in STATUS_CONFIG) {
    const color = STATUS_CONFIG[status as TaskStatus].color
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-400',
      blue: 'bg-blue-500',
      amber: 'bg-amber-500',
      green: 'bg-green-500',
    }
    return colorMap[color] || 'bg-gray-400'
  }
  return 'bg-gray-400'
}

export function CustomStatusEditor({ statuses, onChange }: Props) {
  const [newStatus, setNewStatus] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleRename = (index: number, value: string) => {
    const updated = [...statuses]
    updated[index] = value
    onChange(updated)
  }

  const handleDelete = (index: number) => {
    if (statuses.length <= 1) return
    const updated = statuses.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleAdd = () => {
    const trimmed = newStatus.trim()
    if (!trimmed) return
    if (statuses.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...statuses, trimmed])
    setNewStatus('')
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    const updated = [...statuses]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, moved)
    onChange(updated)
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  return (
    <div className="space-y-2">
      {/* Status list */}
      <div className="space-y-1">
        {statuses.map((status, index) => {
          const isDefault = DEFAULT_STATUS_KEYS.includes(status as TaskStatus)
          const dotColor = getStatusDotColor(status)

          return (
            <div
              key={`${status}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800 ${
                dragIndex === index ? 'opacity-50' : ''
              }`}
            >
              <GripVertical size={14} className="shrink-0 cursor-grab text-gray-400 dark:text-gray-500" />
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
              <input
                type="text"
                value={status}
                onChange={(e) => handleRename(index, e.target.value)}
                readOnly={isDefault}
                className={`flex-1 bg-transparent text-sm text-gray-900 focus:outline-none dark:text-gray-100 ${
                  isDefault ? 'cursor-default' : ''
                }`}
                aria-label={`Status name: ${status}`}
              />
              {statuses.length > 1 && !isDefault && (
                <button
                  onClick={() => handleDelete(index)}
                  className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label={`Remove status ${status}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add new status */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          onKeyDown={handleAddKeyDown}
          placeholder="New status name..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        <Button size="sm" variant="secondary" onClick={handleAdd} disabled={!newStatus.trim()}>
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}
