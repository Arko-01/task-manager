import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Inbox, Search, Bell, MessageCircle, Plus } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'
import { useTeamStore } from '../../store/teamStore'
import { MobileTaskCreate } from '../tasks/MobileTaskCreate'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadCount } = useNotificationStore()
  const { currentTeam } = useTeamStore()
  const [mobileCreateOpen, setMobileCreateOpen] = useState(false)

  const items = [
    { path: '/', icon: LayoutDashboard, label: 'Tasks' },
    ...(currentTeam ? [{ path: '/team', icon: Inbox, label: 'Team' }] : []),
    { path: '#search', icon: Search, label: 'Search', action: () => window.dispatchEvent(new CustomEvent('open-search')) },
    { path: '#chat', icon: MessageCircle, label: 'Chat', action: () => window.dispatchEvent(new CustomEvent('toggle-chat')) },
    { path: '#notif', icon: Bell, label: 'Alerts', badge: unreadCount },
  ]

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setMobileCreateOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:bg-primary-700 active:scale-95 dark:bg-primary-500 dark:hover:bg-primary-600 lg:hidden"
        aria-label="Create new task"
      >
        <Plus size={24} />
      </button>

      <MobileTaskCreate isOpen={mobileCreateOpen} onClose={() => setMobileCreateOpen(false)} />

    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:hidden safe-area-bottom">
      {items.map((item) => {
        const isActive = item.path === location.pathname
        return (
          <button
            key={item.path}
            onClick={() => item.action ? item.action() : navigate(item.path)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <div className="relative">
              <item.icon size={20} />
              {item.badge ? (
                <span className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </div>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
    </>
  )
}
