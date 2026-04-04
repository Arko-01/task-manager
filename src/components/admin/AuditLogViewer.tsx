import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'
import type { AuditLogEntry } from '../../types'

interface AuditLogViewerProps {
  teamId: string
}

const PAGE_SIZE = 50

export function AuditLogViewer({ teamId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [actions, setActions] = useState<string[]>([])

  const fetchLogs = async (offset = 0, append = false) => {
    setLoading(true)
    let query = supabase
      .from('audit_logs')
      .select('*, profile:profiles(*)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (filterUser) query = query.eq('user_id', filterUser)
    if (filterAction) query = query.eq('action', filterAction)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`)

    const { data } = await query
    const entries = (data as AuditLogEntry[]) || []

    if (append) {
      setLogs((prev) => [...prev, ...entries])
    } else {
      setLogs(entries)
    }
    setHasMore(entries.length === PAGE_SIZE)
    setLoading(false)
  }

  // Fetch distinct users and actions for filters
  useEffect(() => {
    async function fetchFilterOptions() {
      const { data: logData } = await supabase
        .from('audit_logs')
        .select('user_id, action, profile:profiles(full_name)')
        .eq('team_id', teamId)

      if (logData) {
        const userMap = new Map<string, string>()
        const actionSet = new Set<string>()
        for (const row of logData as unknown as Array<{ user_id: string; action: string; profile: { full_name: string } | null }>) {
          if (row.user_id && row.profile?.full_name) {
            userMap.set(row.user_id, row.profile.full_name)
          }
          if (row.action) actionSet.add(row.action)
        }
        setUsers(Array.from(userMap.entries()).map(([id, name]) => ({ id, name })))
        setActions(Array.from(actionSet).sort())
      }
    }
    fetchFilterOptions()
  }, [teamId])

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, filterUser, filterAction, dateFrom, dateTo])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          aria-label="Filter by user"
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          aria-label="Filter by action"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          aria-label="Date from"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          aria-label="Date to"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Entity</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatTime(log.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={log.profile?.full_name} url={log.profile?.avatar_url} size="sm" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{log.profile?.full_name || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {log.entity_type}{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ''}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details) : '-'}
                </td>
              </tr>
            ))}
            {!loading && !logs.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-400">Loading...</p>
      )}

      {hasMore && !loading && (
        <div className="text-center">
          <button
            onClick={() => fetchLogs(logs.length, true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
