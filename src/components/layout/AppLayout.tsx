import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumbs } from './Breadcrumbs'
import { BottomNav } from './BottomNav'
import { ChatPanel } from '../chat/ChatPanel'
import { GlobalSearch } from '../search/GlobalSearch'
import { KeyboardShortcutsHelp } from '../ui/KeyboardShortcutsHelp'
import { InteractiveTour } from '../onboarding/InteractiveTour'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useNProgress } from '../../hooks/useNProgress'
import { useTaskStore } from '../../store/taskStore'

export function AppLayout() {
  useNProgress()
  useKeyboardShortcuts()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [showTour, setShowTour] = useState(() => localStorage.getItem('tour-completed') !== 'true')

  // Close chat when task detail opens
  useEffect(() => {
    let prev = useTaskStore.getState().currentTask
    const unsub = useTaskStore.subscribe((state) => {
      if (state.currentTask && state.currentTask !== prev) setChatOpen(false)
      prev = state.currentTask
    })
    return unsub
  }, [])

  const handleToggleChat = useCallback(() => {
    setChatOpen((prev) => {
      if (!prev) useTaskStore.getState().setCurrentTask(null)
      return !prev
    })
  }, [])

  // Listen for toggle-chat events from BottomNav
  useEffect(() => {
    const handler = () => handleToggleChat()
    window.addEventListener('toggle-chat', handler)
    return () => window.removeEventListener('toggle-chat', handler)
  }, [handleToggleChat])

  // Listen for start-tour events
  useEffect(() => {
    const handler = () => setShowTour(true)
    window.addEventListener('start-tour', handler)
    return () => window.removeEventListener('start-tour', handler)
  }, [])

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
          onToggleChat={handleToggleChat}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-6">
          <Breadcrumbs />
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

      {/* Interactive Tour */}
      {showTour && (
        <InteractiveTour steps={[]} onComplete={() => setShowTour(false)} />
      )}
    </div>
  )
}
