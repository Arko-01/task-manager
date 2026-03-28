import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../components/ui/Toast'
import { useTheme } from '../hooks/useTheme'

export function ProfilePage() {
  const { profile, updateProfile } = useAuthStore()
  const { showToast } = useToast()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)

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
    </div>
  )
}
