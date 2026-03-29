import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../components/ui/Toast'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../lib/supabase'
import type { NotificationPreferences } from '../types'

const NOTIFICATION_TYPES = [
  { key: 'task_assigned', label: 'Task assigned to me' },
  { key: 'comment_added', label: 'New comment on my task' },
  { key: 'status_changed', label: 'Task status changed' },
]

export function ProfilePage() {
  const { profile, updateProfile } = useAuthStore()
  const { showToast } = useToast()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', profile.id)
      .single()
      .then(({ data }) => {
        if (data) setNotifPrefs(data as NotificationPreferences)
        else setNotifPrefs({
          user_id: profile.id,
          preferences: Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t.key, { in_app: true, push: false }])),
          quiet_hours_enabled: false,
          quiet_hours_start: null,
          quiet_hours_end: null,
        })
      })
  }, [profile])

  const saveNotifPrefs = async (updated: NotificationPreferences) => {
    setNotifPrefs(updated)
    await supabase.from('notification_preferences').upsert(updated)
  }

  const toggleNotifPref = (key: string, field: 'in_app') => {
    if (!notifPrefs) return
    const current = notifPrefs.preferences[key] || { in_app: true, push: false }
    const updated = { ...notifPrefs, preferences: { ...notifPrefs.preferences, [key]: { ...current, [field]: !current[field] } } }
    saveNotifPrefs(updated)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { error } = await updateProfile({ full_name: name.trim() })
    setLoading(false)
    if (error) showToast(error, 'error')
    else showToast('Profile updated', 'success')
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Profile Settings</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar name={profile?.full_name} url={profile?.avatar_url} size="lg" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{profile?.full_name}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        {/* Name */}
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Theme */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Notification Preferences */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Notification Preferences</h2>
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
        {NOTIFICATION_TYPES.map((type) => {
          const pref = notifPrefs?.preferences[type.key] || { in_app: true, push: false }
          return (
            <div key={type.key} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={pref.in_app}
                  onChange={() => toggleNotifPref(type.key, 'in_app')}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full dark:bg-gray-700" />
              </label>
            </div>
          )
        })}

        {/* Quiet Hours */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Quiet hours</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={notifPrefs?.quiet_hours_enabled || false}
                onChange={() => notifPrefs && saveNotifPrefs({ ...notifPrefs, quiet_hours_enabled: !notifPrefs.quiet_hours_enabled })}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full dark:bg-gray-700" />
            </label>
          </div>
          {notifPrefs?.quiet_hours_enabled && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={notifPrefs.quiet_hours_start || '22:00'}
                onChange={(e) => saveNotifPrefs({ ...notifPrefs, quiet_hours_start: e.target.value })}
                className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="time"
                value={notifPrefs.quiet_hours_end || '08:00'}
                onChange={(e) => saveNotifPrefs({ ...notifPrefs, quiet_hours_end: e.target.value })}
                className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
