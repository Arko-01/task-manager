import { Search, X } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import type { TaskSort } from '../../store/taskStore'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types'
import type { TaskStatus, TaskPriority } from '../../types'

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'position', label: 'Manual order' },
  { value: 'end_date', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
  { value: 'created_at', label: 'Created' },
]

interface Props {
  showResponsibility?: boolean
  showAssignee?: boolean
  assigneeOptions?: { id: string; name: string }[]
}

export function TaskFilters({ showResponsibility, showAssignee, assigneeOptions }: Props) {
  const { filters, setFilters } = useTaskStore()

  const hasFilters = filters.status || filters.priority || filters.assignee_id || filters.search || (filters.responsibility && filters.responsibility !== 'all')

  const clearFilters = () => setFilters({})

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
          placeholder="Filter tasks..."
          className="w-40 rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status || ''}
        onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as TaskStatus | undefined })}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <option value="">All Status</option>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      {/* Priority */}
      <select
        value={filters.priority ?? ''}
        onChange={(e) => setFilters({ ...filters, priority: (e.target.value ? Number(e.target.value) : undefined) as TaskPriority | undefined })}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <option value="">All Priority</option>
        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      {/* Responsibility filter (My Tasks) */}
      {showResponsibility && (
        <select
          value={filters.responsibility || 'all'}
          onChange={(e) => setFilters({ ...filters, responsibility: e.target.value as 'primary' | 'secondary' | 'all' })}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="all">All Roles</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
        </select>
      )}

      {/* Assignee filter */}
      {showAssignee && assigneeOptions && (
        <select
          value={filters.assignee_id || ''}
          onChange={(e) => setFilters({ ...filters, assignee_id: e.target.value || undefined })}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">All Assignees</option>
          {assigneeOptions.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      )}

      {/* Sort */}
      <select
        value={filters.sort || ''}
        onChange={(e) => setFilters({ ...filters, sort: (e.target.value || undefined) as TaskSort | undefined })}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <option value="">Default sort</option>
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  )
}
