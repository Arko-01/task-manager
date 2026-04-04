import type { Milestone } from '../../types'

interface Props {
  milestones: Milestone[]
  value: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
}

export function MilestoneSelector({ milestones, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Milestone
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className={`w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <option value="">None</option>
        {milestones.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}{m.target_date ? ` (${m.target_date})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
