import { List, LayoutGrid, Calendar, BarChart3 } from 'lucide-react'
import type { ViewType } from '../../types'

interface Props {
  current: ViewType
  onChange: (view: ViewType) => void
}

const views: { type: ViewType; icon: typeof List; label: string }[] = [
  { type: 'list', icon: List, label: 'List' },
  { type: 'board', icon: LayoutGrid, label: 'Board' },
  { type: 'calendar', icon: Calendar, label: 'Calendar' },
  { type: 'gantt', icon: BarChart3, label: 'Gantt' },
]

export function ViewToggle({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
      {views.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            current === type
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}
