import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { supabase } from '../../lib/supabase'
interface SearchResult {
  id: string
  title: string
  status: string
  project_id: string
  project?: { id: string; name: string; emoji: string | null }
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    const handleClose = () => setOpen(false)
    window.addEventListener('open-search', handleOpen)
    window.addEventListener('close-all', handleClose)
    return () => {
      window.removeEventListener('open-search', handleOpen)
      window.removeEventListener('close-all', handleClose)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
    }
  }, [open])

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name, emoji)')
      .ilike('title', `%${term}%`)
      .is('deleted_at', null)
      .limit(20)
    setResults((data as SearchResult[]) || [])
    setLoading(false)
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  const handleSelect = (task: SearchResult) => {
    setOpen(false)
    navigate(`/projects/${task.project_id}`)
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg">
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search tasks... (Ctrl+K)"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-sm text-gray-400">Searching...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">No results found</div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center text-sm text-gray-400">Type to search tasks...</div>
          )}

          {!loading && results.map((task) => (
            <button
              key={task.id}
              onClick={() => handleSelect(task)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FileText size={16} className="shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {task.title}
                </p>
                {task.project && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {task.project.emoji && `${task.project.emoji} `}{task.project.name}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                task.status === 'done'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : task.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : task.status === 'on_hold'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
