import { useState, useEffect, useRef } from 'react'
import { X, Send, Plus, ArrowLeft, MessageCircle } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useTeamStore } from '../../store/teamStore'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui/Avatar'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import type { Conversation } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
}

export function ChatPanel({ open, onClose }: Props) {
  const { conversations, currentConversation, messages, fetchConversations, selectConversation, sendMessage, createDirectConversation, createGroupConversation } = useChatStore()
  const { members } = useTeamStore()
  const { profile } = useAuthStore()
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) fetchConversations()
  }, [open, fetchConversations])

  useEffect(() => {
    if (currentConversation) {
      const unsub = useChatStore.getState().subscribeToMessages()
      return unsub
    }
  }, [currentConversation?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    const { error } = await sendMessage(content.trim())
    if (error) showToast(error, 'error')
    else setContent('')
  }

  const handleNewDirect = async (userId: string) => {
    const { error } = await createDirectConversation(userId)
    if (error) showToast(error, 'error')
    setShowNewChat(false)
  }

  const handleNewGroup = async () => {
    if (!groupName.trim() || !selectedMembers.length) return
    const { error } = await createGroupConversation(groupName.trim(), selectedMembers)
    if (error) showToast(error, 'error')
    else { setShowNewChat(false); setGroupName(''); setSelectedMembers([]) }
  }

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name
    if (conv.type === 'team') return 'Team Chat'
    const other = conv.members?.find((m) => m.user_id !== profile?.id)
    return other?.profile?.full_name || 'Chat'
  }

  const formatTime = (d: string) => {
    const date = new Date(d)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className={`fixed inset-y-0 right-0 z-20 w-80 border-l border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        {currentConversation ? (
          <>
            <button onClick={() => useChatStore.setState({ currentConversation: null })} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <ArrowLeft size={18} />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-gray-900 dark:text-gray-100 truncate mx-2">
              {getConversationName(currentConversation)}
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-primary-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Chat</span>
            </div>
            <button onClick={() => setShowNewChat(true)} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Plus size={16} />
            </button>
          </>
        )}
        <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      {!currentConversation ? (
        /* Conversation list */
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            >
              <Avatar
                name={getConversationName(conv)}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getConversationName(conv)}
                  </span>
                  {conv.last_message && (
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(conv.last_message.created_at)}</span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {conv.last_message.content}
                  </p>
                )}
              </div>
              {(conv.unread_count || 0) > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-medium text-white shrink-0">
                  {conv.unread_count}
                </span>
              )}
            </button>
          ))}
          {!conversations.length && (
            <div className="py-8 text-center text-sm text-gray-400">No conversations yet</div>
          )}
        </div>
      ) : (
        /* Messages */
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.sender_id === profile?.id
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMe ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'}`}>
                    {!isMe && (
                      <p className="text-xs font-medium mb-0.5 opacity-70">
                        {msg.sender?.full_name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={handleSend} className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <button type="submit" disabled={!content.trim()} className="rounded-lg p-2 text-primary-600 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-400">
                <Send size={18} />
              </button>
            </div>
          </form>
        </>
      )}

      {/* New Chat Modal */}
      <Modal open={showNewChat} onClose={() => setShowNewChat(false)} title="New Conversation" size="sm">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setChatType('direct')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${chatType === 'direct' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400'}`}
            >
              Direct
            </button>
            <button
              onClick={() => setChatType('group')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${chatType === 'group' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400'}`}
            >
              Group
            </button>
          </div>

          {chatType === 'direct' ? (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {members.filter((m) => m.user_id !== profile?.id).map((m) => (
                <button
                  key={m.user_id}
                  onClick={() => handleNewDirect(m.user_id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Avatar name={m.profile?.full_name} size="sm" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{m.profile?.full_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <Input label="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Design Team Chat" />
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {members.filter((m) => m.user_id !== profile?.id).map((m) => (
                  <label key={m.user_id} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(m.user_id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMembers([...selectedMembers, m.user_id])
                        else setSelectedMembers(selectedMembers.filter((id) => id !== m.user_id))
                      }}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <Avatar name={m.profile?.full_name} size="sm" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{m.profile?.full_name}</span>
                  </label>
                ))}
              </div>
              <Button onClick={handleNewGroup} disabled={!groupName.trim() || !selectedMembers.length}>
                Create Group
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
