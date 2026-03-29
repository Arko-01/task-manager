import { useState, useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'
import { useNavigate } from 'react-router-dom'

export function NotificationDropdown() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    useNotificationStore.getState().fetchNotifications()
    const unsub = useNotificationStore.getState().subscribeToNotifications()
    return unsub
  }, [])

  const formatTime = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'now'
    if (diffMin < 60) return `${diffMin}m`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleClick = async (notif: typeof notifications[0]) => {
    if (!notif.is_read) await markRead(notif.id)
    if (notif.link) navigate(notif.link)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !notif.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{notif.body}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-gray-400">{formatTime(notif.created_at)}</span>
                    {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                  </div>
                </button>
              ))}
              {!notifications.length && (
                <div className="py-6 text-center text-sm text-gray-400">No notifications</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
