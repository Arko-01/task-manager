import { useMemo } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line,
  ResponsiveContainer, Legend,
} from 'recharts'
import { format, startOfWeek, subWeeks } from 'date-fns'
import type { Task, TeamMember } from '../../types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types'

interface Props {
  tasks: Task[]
  teamMembers?: TeamMember[]
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#6b7280',
  in_progress: '#3b82f6',
  on_hold: '#eab308',
  done: '#22c55e',
}

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#6b7280',
}

export function ReportsView({ tasks }: Props) {
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] || 0) + 1
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]?.label || key,
      value,
      color: STATUS_COLORS[key] || '#6b7280',
    }))
  }, [tasks])

  const assigneeData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of tasks) {
      if (t.assignees && t.assignees.length > 0) {
        for (const a of t.assignees) {
          const name = a.profile?.full_name || 'Unknown'
          counts[name] = (counts[name] || 0) + 1
        }
      } else {
        counts['Unassigned'] = (counts['Unassigned'] || 0) + 1
      }
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [tasks])

  const priorityData = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const t of tasks) {
      counts[t.priority] = (counts[t.priority] || 0) + 1
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: PRIORITY_CONFIG[Number(key) as keyof typeof PRIORITY_CONFIG]?.label || `P${key}`,
      value,
      color: PRIORITY_COLORS[Number(key)] || '#6b7280',
    }))
  }, [tasks])

  const timeData = useMemo(() => {
    const now = new Date()
    const weeks: { label: string; start: Date; end: Date }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weeks.push({
        label: format(weekStart, 'MMM d'),
        start: weekStart,
        end: weekEnd,
      })
    }

    return weeks.map((w) => {
      const count = tasks.filter((t) => {
        if (t.status !== 'done') return false
        const updated = new Date(t.updated_at)
        return updated >= w.start && updated <= w.end
      }).length
      return { name: w.label, completed: count }
    })
  }, [tasks])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Status Distribution */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Status Distribution</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-gray-900, #111827)',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data</div>
        )}
      </div>

      {/* Workload by Assignee */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Workload by Assignee</h3>
        {assigneeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={assigneeData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" name="Tasks" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data</div>
        )}
      </div>

      {/* Priority Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Priority Breakdown</h3>
        {priorityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">No data</div>
        )}
      </div>

      {/* Tasks Over Time */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Tasks Completed Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={timeData} margin={{ left: 0, right: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
