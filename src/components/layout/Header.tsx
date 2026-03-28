import { Search, Moon, Sun, Monitor, Menu, MessageCircle } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { NotificationDropdown } from '../notifications/NotificationDropdown'

interface HeaderProps {
  onToggleSidebar: () => void
  onToggleChat?: () => void
}

export function Header({ onToggleSidebar, onToggleChat }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  const themeIcon = theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Global Search */}
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            readOnly
            placeholder="Search... (Ctrl+K)"
            onFocus={(e) => {
              e.target.blur()
              window.dispatchEvent(new CustomEvent('open-search'))
            }}
            className="w-64 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          title={`Theme: ${theme}`}
        >
          {themeIcon}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Chat Toggle */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <MessageCircle size={18} />
          </button>
        )}
      </div>
    </header>
  )
}
