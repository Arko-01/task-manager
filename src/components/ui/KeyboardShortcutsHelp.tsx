import { useState, useEffect } from 'react'
import { Modal } from './Modal'

const shortcuts = [
  { keys: ['n'], description: 'New task' },
  { keys: ['Ctrl', 'K'], description: 'Search' },
  { keys: ['/'], description: 'Search' },
  { keys: ['1'], description: 'List view' },
  { keys: ['2'], description: 'Board view' },
  { keys: ['3'], description: 'Calendar view' },
  { keys: ['4'], description: 'Gantt view' },
  { keys: ['?'], description: 'Keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close panel / modal' },
]

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setOpen((prev) => !prev)
    const handleClose = () => setOpen(false)
    window.addEventListener('toggle-help', handleToggle)
    window.addEventListener('close-all', handleClose)
    return () => {
      window.removeEventListener('toggle-help', handleToggle)
      window.removeEventListener('close-all', handleClose)
    }
  }, [])

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard Shortcuts" size="md">
      <div className="grid gap-3">
        {shortcuts.map((shortcut, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{shortcut.description}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, j) => (
                <span key={j} className="flex items-center gap-1">
                  {j > 0 && <span className="text-xs text-gray-400">+</span>}
                  <Kbd>{key}</Kbd>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
