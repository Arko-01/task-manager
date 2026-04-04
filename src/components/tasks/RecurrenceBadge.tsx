import { Repeat } from 'lucide-react'
import type { RecurrencePattern } from '../../types'

interface Props {
  isRecurring: boolean
  pattern: RecurrencePattern | null
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatPattern(pattern: RecurrencePattern): string {
  switch (pattern.frequency) {
    case 'daily':
      return pattern.interval > 1 ? `Every ${pattern.interval} days` : 'Daily'
    case 'weekly': {
      const days = pattern.days_of_week?.map((d) => DAY_NAMES[d]).join(', ')
      return days ? `Weekly on ${days}` : 'Weekly'
    }
    case 'monthly': {
      const day = pattern.day_of_month
      if (day) {
        const suffix = day === 1 || day === 21 || day === 31 ? 'st'
          : day === 2 || day === 22 ? 'nd'
          : day === 3 || day === 23 ? 'rd'
          : 'th'
        return `Monthly on ${day}${suffix}`
      }
      return 'Monthly'
    }
    case 'custom':
      return 'Custom'
    default:
      return 'Recurring'
  }
}

export function RecurrenceBadge({ isRecurring, pattern }: Props) {
  if (!isRecurring || !pattern) return null

  const label = formatPattern(pattern)

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
      <Repeat size={12} />
      {label}
    </span>
  )
}
