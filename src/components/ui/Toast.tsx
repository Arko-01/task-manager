import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  onUndo?: () => void
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type'], onUndo?: () => void) => void
  showToast: (message: string, type?: Toast['type'], onUndo?: () => void) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {}, showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: Toast['type'] = 'info', onUndo?: () => void) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type, onUndo }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, showToast: toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
        {toasts.slice(-3).reverse().map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    info: 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  }

  return (
    <div role="alert" className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-sm transition-all duration-300 animate-in slide-in-from-right ${colors[toast.type]}`}>
      <span>{toast.message}</span>
      {toast.onUndo && (
        <button
          onClick={() => { toast.onUndo?.(); onDismiss(toast.id) }}
          className="ml-1 text-xs font-medium underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          Undo
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} className="ml-2 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}
