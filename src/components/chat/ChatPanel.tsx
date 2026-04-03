import { useState, useEffect, useRef } from 'react'
import { X, Send, Plus, ArrowLeft, MessageCircle, Check, CheckCheck, Users } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useTeamStore } from '../../store/teamStore'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui/Avatar'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import type { Conversation, Message } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
}

// ── Date helpers ──

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function formatDateSeparator(date: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
}

function formatMessageTime(d: string): string {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatConversationTime(d: string): string {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, today)) return formatMessageTime(d)
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Tick component ──

function MessageTicks({ messageId, isMe, conversationMembers }: { messageId: string; isMe: boolean; conversationMembers: number }) {
  const reads = useChatStore((s) => s.messageReads[messageId])

  if (!isMe) return null

  // Count how many OTHER members have read (exclude self)
  const readCount = reads?.length || 0
  // Message is "read" if at least one other member read it (for DM) or all others (for group)
  const othersCount = Math.max(conversationMembers - 1, 1)
  const allRead = readCount >= othersCount

  if (allRead && readCount > 0) {
    // Blue double ticks — read by all
    return <CheckCheck size={14} className="text-blue-400 shrink-0" />
  }

  // Single tick — sent (delivered)
  return <Check size={14} className="text-white/60 shrink-0" />
}

export function ChatPanel({ open, onClose }: Props) {
  const { conversations, currentConversation, messages, fetchConversations, selectConversation, sendMessage, createDirectConversation, createGroupConversation } = useChatStore()
  const { members, currentTeam, fetchMembers } = useTeamStore()
  const { profile } = useAuthStore()
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct')
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      fetchConversations()
      if (currentTeam) fetchMembers(currentTeam.id)
    }
  }, [open, fetchConversations, currentTeam, fetchMembers])

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

  // Group messages by date for separators
  const groupedMessages = messages.reduce<{ date: string; messages: Message[] }[]>((groups, msg) => {
    const msgDate = new Date(msg.created_at)
    const dateKey = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ date: dateKey, messages: [msg] })
    }
    return groups
  }, [])

  const memberCount = currentConversation?.members?.length || 2

  if (!open) return null

  return (
    <div className="fixed inset-y-0 right-0 z-20 w-80 border-l border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        {currentConversation ? (
          <>
            <button onClick={() => { useChatStore.setState({ currentConversation: null }); setShowGroupInfo(false) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <ArrowLeft size={18} />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-gray-900 dark:text-gray-100 truncate mx-2">
              {getConversationName(currentConversation)}
            </span>
            {(currentConversation.type === 'group' || currentConversation.type === 'team') && (
              <button
                onClick={() => setShowGroupInfo(!showGroupInfo)}
                className={`rounded p-1 ${showGroupInfo ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Group members"
              >
                <Users size={16} />
              </button>
            )}
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

      {/* Group Members Panel */}
      {currentConversation && showGroupInfo && (currentConversation.type === 'group' || currentConversation.type === 'team') && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {currentConversation.members?.length || 0} members
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {currentConversation.members?.map((m) => (
              <div key={m.user_id} className="flex items-center gap-2">
                <Avatar name={m.profile?.full_name} size="xs" />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {m.profile?.full_name || 'Unknown'}
                  {m.user_id === profile?.id && (
                    <span className="text-gray-400 dark:text-gray-500 ml-1">(You)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{formatConversationTime(conv.last_message.created_at)}</span>
                  )}
                </div>
                {conv.last_message && (
                  <div className="flex items-center gap-1">
                    {conv.last_message.sender_id === profile?.id && (
                      <CheckCheck size={12} className="text-gray-400 shrink-0" />
                    )}
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {conv.last_message.content}
                    </p>
                  </div>
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
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {groupedMessages.map((group) => {
              const firstMsg = group.messages[0]
              const groupDate = new Date(firstMsg.created_at)
              return (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {formatDateSeparator(groupDate)}
                    </span>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-1.5">
                    {group.messages.map((msg) => {
                      const isMe = msg.sender_id === profile?.id
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-1.5 ${isMe ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'}`}>
                            {!isMe && (currentConversation.type === 'group' || currentConversation.type === 'team') && (
                              <p className="text-xs font-medium mb-0.5 opacity-70">
                                {msg.sender?.full_name}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                              <span className="text-[10px]">{formatMessageTime(msg.created_at)}</span>
                              <MessageTicks messageId={msg.id} isMe={isMe} conversationMembers={memberCount} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
