import { useState } from 'react'
import { Repeat } from 'lucide-react'
import type { RecurrencePattern } from '../../types'

interface Props {
  isRecurring: boolean
  pattern: RecurrencePattern | null
  onChange: (isRecurring: boolean, pattern: RecurrencePattern | null) => void
}

const FREQUENCIES: { value: RecurrencePattern['frequency']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function RecurrenceSelector({ isRecurring, pattern, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)

  const handleToggle = () => {
    if (isRecurring) {
      onChange(false, null)
    } else {
      onChange(true, { frequency: 'weekly', interval: 1 })
      setExpanded(true)
    }
  }

  const updatePattern = (updates: Partial<RecurrencePattern>) => {
    const base = pattern || { frequency: 'weekly' as const, interval: 1 }
    onChange(true, { ...base, ...updates })
  }

  const formatLabel = () => {
    if (!isRecurring || !pattern) return 'Not recurring'
    const interval = pattern.interval > 1 ? `every ${pattern.interval} ` : 'every '
    switch (pattern.frequency) {
      case 'daily': return interval + (pattern.interval > 1 ? 'days' : 'day')
      case 'weekly': {
        const days = pattern.days_of_week?.map((d) => DAYS[d]).join(', ')
        return interval + (pattern.interval > 1 ? 'weeks' : 'week') + (days ? ` on ${days}` : '')
      }
      case 'monthly': return interval + (pattern.interval > 1 ? 'months' : 'month')
      default: return 'Custom'
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Recurrence
      </label>

      <button
        onClick={() => isRecurring ? setExpanded(!expanded) : handleToggle()}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700"
      >
        <Repeat size={14} className={isRecurring ? 'text-primary-500' : 'text-gray-400'} />
        <span className={isRecurring ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {formatLabel()}
        </span>
      </button>

      {isRecurring && expanded && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <select
              value={pattern?.frequency || 'weekly'}
              onChange={(e) => updatePattern({ frequency: e.target.value as RecurrencePattern['frequency'] })}
              className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500">every</span>
            <input
              type="number"
              min={1}
              max={30}
              value={pattern?.interval || 1}
              onChange={(e) => updatePattern({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-14 rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <span className="text-xs text-gray-500">
              {pattern?.frequency === 'daily' ? 'day(s)' : pattern?.frequency === 'weekly' ? 'week(s)' : 'month(s)'}
            </span>
          </div>

          {pattern?.frequency === 'weekly' && (
            <div className="flex gap-1">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const current = pattern.days_of_week || []
                    const next = current.includes(i) ? current.filter((d) => d !== i) : [...current, i]
                    updatePattern({ days_of_week: next })
                  }}
                  className={`rounded px-2 py-1 text-[10px] font-medium ${
                    pattern.days_of_week?.includes(i)
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">End date (optional):</span>
            <input
              type="date"
              value={pattern?.end_date || ''}
              onChange={(e) => updatePattern({ end_date: e.target.value || undefined })}
              className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <button
            onClick={handleToggle}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Remove recurrence
          </button>
        </div>
      )}
    </div>
  )
}
