import { useEffect } from 'react'

const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName ?? ''
      const isEditing = IGNORED_TAGS.has(tag) || (document.activeElement as HTMLElement)?.isContentEditable

      // Escape always works, even inside inputs
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-all'))
        return
      }

      // Ctrl+K works everywhere
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('open-search'))
        return
      }

      // All other shortcuts only fire outside inputs
      if (isEditing) return

      switch (e.key) {
        case 'n': {
          e.preventDefault()
          const input = document.querySelector<HTMLInputElement>('input[placeholder="Add a task..."]')
          input?.focus()
          break
        }
        case '/': {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('open-search'))
          break
        }
        case '1':
          window.dispatchEvent(new CustomEvent('switch-view', { detail: 'list' }))
          break
        case '2':
          window.dispatchEvent(new CustomEvent('switch-view', { detail: 'board' }))
          break
        case '3':
          window.dispatchEvent(new CustomEvent('switch-view', { detail: 'calendar' }))
          break
        case '4':
          window.dispatchEvent(new CustomEvent('switch-view', { detail: 'gantt' }))
          break
        case '?':
          window.dispatchEvent(new CustomEvent('toggle-help'))
          break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])
}
