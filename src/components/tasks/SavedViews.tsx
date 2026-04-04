import { useState, useEffect, useRef } from 'react'
import { Bookmark, Plus, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useTeamStore } from '../../store/teamStore'
import { useTaskStore } from '../../store/taskStore'
import type { SavedView, ViewType } from '../../types'

interface Props {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export function SavedViews({ currentView, onViewChange }: Props) {
  const [open, setOpen] = useState(false)
  const [views, setViews] = useState<SavedView[]>([])
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const { profile } = useAuthStore()
  const { currentTeam } = useTeamStore()
  const { filters, setFilters } = useTaskStore()
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile?.id && currentTeam?.id) {
      fetchViews()
    }
  }, [profile?.id, currentTeam?.id])

  // Close popover on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSaving(false)
        setNewName('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function fetchViews() {
    const { data } = await supabase
      .from('saved_views')
      .select('*')
      .eq('user_id', profile!.id)
      .eq('team_id', currentTeam!.id)
      .order('created_at')
    if (data) setViews(data as SavedView[])
  }

  async function handleSave() {
    if (!newName.trim() || !profile?.id || !currentTeam?.id) return
    const { error } = await supabase.from('saved_views').insert({
      user_id: profile.id,
      team_id: currentTeam.id,
      name: newName.trim(),
      view_type: currentView,
      filters: filters as Record<string, unknown>,
    })
    if (!error) {
      setNewName('')
      setSaving(false)
      await fetchViews()
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('saved_views').delete().eq('id', id)
    setViews((prev) => prev.filter((v) => v.id !== id))
  }

  function handleApply(view: SavedView) {
    setFilters(view.filters as Parameters<typeof setFilters>[0])
    onViewChange(view.view_type)
    setOpen(false)
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Saved views"
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          open
            ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-750'
        }`}
      >
        <Bookmark size={14} />
        Views
        {views.length > 0 && (
          <span className="ml-0.5 rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {views.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {/* Saved views list */}
          {views.length > 0 && (
            <div className="max-h-48 overflow-y-auto border-b border-gray-100 dark:border-gray-700">
              {views.map((view) => (
                <div
                  key={view.id}
                  className="group flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <button
                    onClick={() => handleApply(view)}
                    className="flex-1 text-left text-xs text-gray-700 dark:text-gray-300 truncate"
                  >
                    <span className="font-medium">{view.name}</span>
                    <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                      {view.view_type}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(view.id)}
                    aria-label={`Delete view ${view.name}`}
                    className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {views.length === 0 && !saving && (
            <div className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
              No saved views yet
            </div>
          )}

          {/* Save current view */}
          <div className="p-2">
            {saving ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') { setSaving(false); setNewName('') }
                  }}
                  placeholder="View name..."
                  className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                <button
                  onClick={handleSave}
                  disabled={!newName.trim()}
                  aria-label="Confirm save view"
                  className="rounded bg-primary-500 p-1 text-white hover:bg-primary-600 disabled:opacity-40"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setSaving(false); setNewName('') }}
                  aria-label="Cancel save view"
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSaving(true)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-750"
              >
                <Plus size={14} />
                Save current view
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
