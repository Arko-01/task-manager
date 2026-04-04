import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, X, Plus, Moon, Settings, Trash2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { supabase } from '../../lib/supabase'

interface SearchResult {
  id: string
  title: string
  description: string | null
  status: string
  project_id: string
  project?: { id: string; name: string; emoji: string | null }
}

interface ParsedQuery {
  text: string
  assignee?: string
  tag?: string
  dateFrom?: string
  dateTo?: string
}

function parseSearchQuery(raw: string): ParsedQuery {
  let text = raw
  let assignee: string | undefined
  let tag: string | undefined
  let dateFrom: string | undefined
  let dateTo: string | undefined

  // Extract @name tokens
  const assigneeMatch = text.match(/@(\S+)/)
  if (assigneeMatch) {
    assignee = assigneeMatch[1]
    text = text.replace(assigneeMatch[0], '').trim()
  }

  // Extract #tag tokens
  const tagMatch = text.match(/#(\S+)/)
  if (tagMatch) {
    tag = tagMatch[1]
    text = text.replace(tagMatch[0], '').trim()
  }

  // Extract due:YYYY-MM-DD..YYYY-MM-DD tokens
  const dateMatch = text.match(/due:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) {
    dateFrom = dateMatch[1]
    dateTo = dateMatch[2]
    text = text.replace(dateMatch[0], '').trim()
  }

  return { text, assignee, tag, dateFrom, dateTo }
}

interface QuickAction {
  id: string
  label: string
  icon: typeof Plus
  action: () => void
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const quickActions: QuickAction[] = [
    { id: 'new-task', label: 'Create new task', icon: Plus, action: () => { setOpen(false); const input = document.querySelector<HTMLInputElement>('input[placeholder="Add a task..."]'); input?.focus() } },
    { id: 'theme', label: 'Toggle theme', icon: Moon, action: () => { setOpen(false); document.querySelector<HTMLButtonElement>('[title^="Theme"]')?.click() } },
    { id: 'settings', label: 'Go to settings', icon: Settings, action: () => { setOpen(false); navigate('/profile') } },
    { id: 'trash', label: 'Go to trash', icon: Trash2, action: () => { setOpen(false); navigate('/trash') } },
  ]

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
      setSelectedIndex(0)
    }
  }, [open])

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)

    const parsed = parseSearchQuery(term)

    let query = supabase
      .from('tasks')
      .select('id, title, description, status, project_id, project:projects(id, name, emoji)')
      .is('deleted_at', null)

    // Text search: use full-text search if available, fall back to ilike
    if (parsed.text) {
      query = query.textSearch('fts', parsed.text, { type: 'websearch', config: 'english' })
    }

    // Tag filter
    if (parsed.tag) {
      query = query.contains('tags', [parsed.tag])
    }

    // Date range filter
    if (parsed.dateFrom && parsed.dateTo) {
      query = query.gte('end_date', parsed.dateFrom).lte('end_date', parsed.dateTo)
    }

    query = query.limit(20)

    const { data } = await query
    let results = (data as unknown as SearchResult[]) || []

    // Assignee filter: post-filter since task_assignees is a separate table
    if (parsed.assignee) {
      const { data: assigneeTaskIds } = await supabase
        .from('task_assignees')
        .select('task_id, profile:profiles!task_assignees_user_id_fkey(full_name)')
        .ilike('profile.full_name', `%${parsed.assignee}%`)
      const matchingIds = new Set((assigneeTaskIds || []).map((a) => a.task_id))
      results = results.filter((r) => matchingIds.has(r.id))
    }

    setResults(results)
    setSelectedIndex(0)
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

  const filteredActions = query
    ? quickActions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : quickActions

  const allItems = [...filteredActions.map((a) => ({ type: 'action' as const, ...a })), ...results.map((r) => ({ type: 'result' as const, ...r }))]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault()
      const item = allItems[selectedIndex]
      if (item.type === 'action') (item as typeof filteredActions[0]).action()
      else handleSelect(item as SearchResult)
    }
  }

  const STATUS_BADGE: Record<string, string> = {
    done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg">
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks... @name #tag due:YYYY-MM-DD..YYYY-MM-DD"
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

        <div className="max-h-80 overflow-y-auto">
          {/* Quick actions */}
          {filteredActions.length > 0 && (
            <>
              <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">Actions</p>
              {filteredActions.map((action, i) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedIndex === i ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <action.icon size={16} className="shrink-0 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{action.label}</span>
                </button>
              ))}
            </>
          )}

          {/* Task results */}
          {loading && <div className="py-6 text-center text-sm text-gray-400">Searching...</div>}

          {!loading && query && results.length === 0 && filteredActions.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-400">No results found</div>
          )}

          {!loading && results.length > 0 && (
            <>
              <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">Tasks</p>
              {results.map((task, i) => {
                const idx = filteredActions.length + i
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelect(task)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selectedIndex === idx ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <FileText size={16} className="shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                      {task.project && (
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {task.project.emoji && `${task.project.emoji} `}{task.project.name}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status] || STATUS_BADGE.todo}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </button>
                )
              })}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-3 pt-2 text-[10px] text-gray-400 dark:border-gray-800">
          <span><kbd className="rounded bg-gray-100 px-1 dark:bg-gray-700">↑↓</kbd> navigate</span>
          <span><kbd className="rounded bg-gray-100 px-1 dark:bg-gray-700">↵</kbd> select</span>
          <span><kbd className="rounded bg-gray-100 px-1 dark:bg-gray-700">esc</kbd> close</span>
          <span className="ml-auto"><kbd className="rounded bg-gray-100 px-1 dark:bg-gray-700">@</kbd> assignee <kbd className="rounded bg-gray-100 px-1 dark:bg-gray-700">#</kbd> tag <kbd className="rounded bg-gray-100 px-1 dark:bg-gray-700">due:</kbd> date range</span>
        </div>
      </div>
    </Modal>
  )
}
