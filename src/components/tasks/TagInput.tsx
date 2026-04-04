import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTeamStore } from '../../store/teamStore'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagInput({ tags, onChange, disabled }: Props) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { currentTeam } = useTeamStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!currentTeam || !input.trim()) {
      setSuggestions([])
      return
    }
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('team_tags')
        .select('name')
        .eq('team_id', currentTeam.id)
        .ilike('name', `%${input}%`)
        .limit(5)
      const names = (data || []).map((t) => t.name).filter((n) => !tags.includes(n))
      setSuggestions(names)
    }
    fetchSuggestions()
  }, [input, currentTeam, tags])

  const addTag = async (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
    setShowSuggestions(false)

    // Save to team_tags for future suggestions
    if (currentTeam) {
      await supabase.from('team_tags').upsert({ team_id: currentTeam.id, name: trimmed }, { onConflict: 'team_id,name' })
    }
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Tags
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {tag}
            {!disabled && (
              <button type="button" onClick={() => removeTag(tag)} className="text-primary-400 hover:text-primary-600">
                <X size={10} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <div className="relative flex-1 min-w-[80px]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={tags.length ? '' : 'Add tags...'}
              className="w-full border-0 bg-transparent px-1 py-0.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
