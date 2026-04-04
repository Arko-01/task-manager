import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ServiceStatus {
  name: string
  status: 'checking' | 'operational' | 'degraded'
  message: string
}

export function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Authentication', status: 'checking', message: 'Checking...' },
    { name: 'Database', status: 'checking', message: 'Checking...' },
    { name: 'Realtime', status: 'checking', message: 'Checking...' },
    { name: 'Storage', status: 'operational', message: 'Available' },
  ])
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [checking, setChecking] = useState(false)

  const checkServices = useCallback(async () => {
    setChecking(true)
    const results: ServiceStatus[] = []

    // Check Auth
    try {
      const { error } = await supabase.auth.getSession()
      results.push({
        name: 'Authentication',
        status: error ? 'degraded' : 'operational',
        message: error ? 'Service issue detected' : 'Operational',
      })
    } catch {
      results.push({ name: 'Authentication', status: 'degraded', message: 'Unable to reach service' })
    }

    // Check Database
    try {
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
      results.push({
        name: 'Database',
        status: error ? 'degraded' : 'operational',
        message: error ? 'Query failed' : 'Operational',
      })
    } catch {
      results.push({ name: 'Database', status: 'degraded', message: 'Unable to reach database' })
    }

    // Check Realtime
    try {
      const channel = supabase.channel('status-check')
      const connected = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000)
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            resolve(true)
          }
        })
      })
      supabase.removeChannel(channel)
      results.push({
        name: 'Realtime',
        status: connected ? 'operational' : 'degraded',
        message: connected ? 'Operational' : 'Connection timeout',
      })
    } catch {
      results.push({ name: 'Realtime', status: 'degraded', message: 'Unable to connect' })
    }

    // Storage (static)
    results.push({ name: 'Storage', status: 'operational', message: 'Available' })

    setServices(results)
    setLastChecked(new Date())
    setChecking(false)
  }, [])

  useEffect(() => {
    checkServices()
  }, [checkServices])

  const allOperational = services.every((s) => s.status === 'operational')
  const anyDegraded = services.some((s) => s.status === 'degraded')

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Status</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Current status of all services.
          </p>
        </div>
        <button
          onClick={checkServices}
          disabled={checking}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overall Status Banner */}
      <div
        className={`mb-6 rounded-xl p-4 ${
          allOperational
            ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : anyDegraded
            ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
            : 'bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }`}
      >
        <div className="flex items-center gap-3">
          {allOperational ? (
            <CheckCircle2 size={20} className="text-green-500" />
          ) : anyDegraded ? (
            <XCircle size={20} className="text-red-500" />
          ) : (
            <Activity size={20} className="text-gray-400 animate-pulse" />
          )}
          <span className={`text-sm font-semibold ${
            allOperational
              ? 'text-green-700 dark:text-green-400'
              : anyDegraded
              ? 'text-red-700 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-300'
          }`}>
            {allOperational
              ? 'All Systems Operational'
              : anyDegraded
              ? 'Some Systems Degraded'
              : 'Checking Systems...'}
          </span>
        </div>
      </div>

      {/* Service List */}
      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  service.status === 'operational'
                    ? 'bg-green-500'
                    : service.status === 'degraded'
                    ? 'bg-red-500'
                    : 'bg-gray-300 animate-pulse'
                }`}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {service.name}
              </span>
            </div>
            <span
              className={`text-xs font-medium ${
                service.status === 'operational'
                  ? 'text-green-600 dark:text-green-400'
                  : service.status === 'degraded'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-400'
              }`}
            >
              {service.message}
            </span>
          </div>
        ))}
      </div>

      {/* Last Checked */}
      {lastChecked && (
        <p className="mt-4 text-center text-xs text-gray-400">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
