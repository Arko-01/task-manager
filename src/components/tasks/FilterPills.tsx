import { X } from 'lucide-react'

const FILTER_LABELS: Record<string, string> = {
  status: 'Status',
  priority: 'Priority',
  task_type: 'Type',
  assignee_id: 'Assignee',
  search: 'Search',
  responsibility: 'Role',
  sort: 'Sort',
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  on_hold: 'On Hold',
}

const PRIORITY_LABELS: Record<string, string> = {
  '0': 'None',
  '1': 'Low',
  '2': 'Medium',
  '3': 'High',
  '4': 'Urgent',
}

const SORT_LABELS: Record<string, string> = {
  position: 'Manual order',
  end_date: 'Due date',
  priority: 'Priority',
  title: 'Title',
  created_at: 'Created',
}

const TYPE_LABELS: Record<string, string> = {
  task: 'Task',
  bug: 'Bug',
  feature: 'Feature',
  improvement: 'Improvement',
}

function formatValue(key: string, value: string): string {
  if (key === 'status') return STATUS_LABELS[value] || value
  if (key === 'priority') return PRIORITY_LABELS[value] || value
  if (key === 'task_type') return TYPE_LABELS[value] || value
  if (key === 'sort') return SORT_LABELS[value] || value
  if (key === 'responsibility') return value === 'primary' ? 'Primary' : value === 'secondary' ? 'Secondary' : value
  return value
}

interface Props {
  filters: Record<string, string | undefined>
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function FilterPills({ filters, onRemove, onClearAll }: Props) {
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => value && !(key === 'responsibility' && value === 'all')
  )

  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
        >
          {FILTER_LABELS[key] || key}: {formatValue(key, value!)}
          <button
            onClick={() => onRemove(key)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary-100 dark:hover:bg-primary-800/30"
            aria-label={`Remove ${FILTER_LABELS[key] || key} filter`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="rounded-full px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        Clear all
      </button>
    </div>
  )
}
