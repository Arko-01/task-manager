import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { ChatPanel } from '../chat/ChatPanel'
import { GlobalSearch } from '../search/GlobalSearch'
import { KeyboardShortcutsHelp } from '../ui/KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

export function AppLayout() {
  useKeyboardShortcuts()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={false} onCollapse={() => {}} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative z-50">
            <Sidebar collapsed={false} onCollapse={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          onToggleChat={() => setChatOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Chat Panel */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Global Modals */}
      <GlobalSearch />
      <KeyboardShortcutsHelp />
    </div>
  )
}
