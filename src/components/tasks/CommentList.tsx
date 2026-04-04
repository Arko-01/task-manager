import { useEffect, useState, useRef } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useAuthStore } from '../../store/authStore'
import { useTeamStore } from '../../store/teamStore'
import { Avatar } from '../ui/Avatar'
import { useToast } from '../ui/Toast'

interface Props {
  taskId: string
}

export function CommentList({ taskId }: Props) {
  const { comments, fetchComments, addComment, deleteComment } = useTaskStore()
  const { profile } = useAuthStore()
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { members } = useTeamStore()
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchComments(taskId)
  }, [taskId, fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    const { error } = await addComment(taskId, content.trim())
    setLoading(false)
    if (error) showToast(error, 'error')
    else setContent('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setContent(val)
    // Check for @ trigger
    const lastAt = val.lastIndexOf('@')
    if (lastAt >= 0 && (lastAt === 0 || val[lastAt - 1] === ' ')) {
      const query = val.slice(lastAt + 1)
      if (!query.includes(' ')) {
        setMentionFilter(query.toLowerCase())
        setShowMentions(true)
        return
      }
    }
    setShowMentions(false)
  }

  const insertMention = (name: string) => {
    const lastAt = content.lastIndexOf('@')
    const before = content.slice(0, lastAt)
    setContent(`${before}@${name} `)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const filteredMembers = members
    .filter((m) => m.user_id !== profile?.id)
    .filter((m) => (m.profile?.full_name || '').toLowerCase().includes(mentionFilter))
    .slice(0, 5)

  const handleDelete = async (commentId: string) => {
    const { error } = await deleteComment(commentId)
    if (error) showToast(error, 'error')
  }

  const formatTime = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Comments
      </label>

      {/* Comments */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <Avatar name={c.profile?.full_name} url={c.profile?.avatar_url} size="sm" className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {c.profile?.full_name || 'User'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(c.created_at)}</span>
                {c.user_id === profile?.id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {c.content.split(/(@\w[\w\s]*?)(?=\s|$)/g).map((part, i) =>
                  part.startsWith('@') ? (
                    <span key={i} className="font-medium text-primary-600 dark:text-primary-400">{part}</span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>
            </div>
          </div>
        ))}
        {!comments.length && (
          <p className="text-xs text-gray-400 dark:text-gray-500">No comments yet</p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={handleInputChange}
            placeholder="Write a comment... (@ to mention)"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            disabled={loading}
            onBlur={() => setTimeout(() => setShowMentions(false), 150)}
          />
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="rounded-lg p-2 text-primary-600 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
          >
            <Send size={16} />
          </button>
        </div>
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
            {filteredMembers.map((m) => (
              <button
                key={m.user_id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(m.profile?.full_name || 'User') }}
                className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Avatar name={m.profile?.full_name} size="xs" />
                <span className="text-xs text-gray-700 dark:text-gray-300">{m.profile?.full_name}</span>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}
