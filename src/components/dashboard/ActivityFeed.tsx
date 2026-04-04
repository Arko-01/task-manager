import { useState, useEffect } from 'react'
import { Plus, ArrowRight, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'
import type { ActivityLogEntry } from '../../types'

interface Props {
  teamId: string
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  status_changed: ArrowRight,
  deleted: Trash2,
}

function formatTime(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function describeAction(entry: ActivityLogEntry): string {
  const name = entry.profile?.full_name || 'Someone'
  const title = entry.entity_title || entry.entity_type
  switch (entry.action) {
    case 'created':
      return `${name} created ${title}`
    case 'status_changed': {
      const to = (entry.metadata as Record<string, string>)?.new_status || ''
      return `${name} moved ${title}${to ? ` to ${to}` : ''}`
    }
    case 'deleted':
      return `${name} deleted ${title}`
    default:
      return `${name} ${entry.action} ${title}`
  }
}

export function ActivityFeed({ teamId }: Props) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('activity_log')
        .select('*, profile:profiles!activity_log_user_id_fkey(*)')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!cancelled) {
        setActivities((data as ActivityLogEntry[]) || [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [teamId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    )
  }

  if (!activities.length) {
    return (
      <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        No recent activity
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {activities.map((entry) => {
        const Icon = ACTION_ICONS[entry.action] || ArrowRight
        return (
          <div key={entry.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <Avatar name={entry.profile?.full_name} url={entry.profile?.avatar_url} size="sm" className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-300">{describeAction(entry)}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Icon size={10} className="text-gray-400" />
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(entry.created_at)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
