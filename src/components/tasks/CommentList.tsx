import { useEffect, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useAuthStore } from '../../store/authStore'
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
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
        {!comments.length && (
          <p className="text-xs text-gray-400 dark:text-gray-500">No comments yet</p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="rounded-lg p-2 text-primary-600 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
