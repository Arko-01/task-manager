import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Conversation, Message, MessageRead } from '../types'

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  messageReads: Record<string, MessageRead[]> // messageId -> reads by other users
  loading: boolean
  fetchConversations: () => Promise<void>
  selectConversation: (convId: string) => Promise<void>
  createDirectConversation: (otherUserId: string) => Promise<{ error: string | null; conversation?: Conversation }>
  createGroupConversation: (name: string, memberIds: string[]) => Promise<{ error: string | null }>
  sendMessage: (content: string) => Promise<{ error: string | null }>
  markRead: (messageId: string) => Promise<void>
  markAllRead: (conversationId: string) => Promise<void>
  subscribeToMessages: () => () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  messageReads: {},
  loading: false,

  fetchConversations: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: memberOf } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (!memberOf?.length) { set({ conversations: [] }); return }

    const convIds = memberOf.map((m) => m.conversation_id)
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('created_at', { ascending: false })

    if (!convs) { set({ conversations: [] }); return }

    // Batch: fetch all members and recent messages in parallel instead of per-conversation
    const [{ data: allMembers }, { data: allMessages }, { data: allOtherMsgs }, { data: allReads }] = await Promise.all([
      supabase
        .from('conversation_members')
        .select('*, profile:profiles(*)')
        .in('conversation_id', convIds),
      supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('id, conversation_id')
        .in('conversation_id', convIds)
        .neq('sender_id', user.id),
      supabase
        .from('message_reads')
        .select('message_id')
        .eq('user_id', user.id),
    ])

    const readSet = new Set((allReads || []).map((r) => r.message_id))

    for (const conv of convs) {
      conv.members = (allMembers || []).filter((m) => m.conversation_id === conv.id)
      conv.last_message = (allMessages || []).find((m) => m.conversation_id === conv.id) || null
      const otherMsgs = (allOtherMsgs || []).filter((m) => m.conversation_id === conv.id)
      conv.unread_count = otherMsgs.filter((m) => !readSet.has(m.id)).length
    }

    set({ conversations: convs as Conversation[] })
  },

  selectConversation: async (convId) => {
    const conv = get().conversations.find((c) => c.id === convId)
    set({ currentConversation: conv || null, loading: true, messageReads: {} })

    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('conversation_id', convId)
      .order('created_at')

    const msgs = (data as Message[]) || []
    set({ messages: msgs, loading: false })

    // Auto-mark all unread messages as read
    await get().markAllRead(convId)

    // Fetch read receipts for messages sent by current user
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const myMsgIds = msgs.filter((m) => m.sender_id === user.id).map((m) => m.id)
      if (myMsgIds.length) {
        const { data: reads } = await supabase
          .from('message_reads')
          .select('message_id, user_id, read_at')
          .in('message_id', myMsgIds)

        if (reads) {
          const readsMap: Record<string, MessageRead[]> = {}
          for (const read of reads) {
            if (!readsMap[read.message_id]) readsMap[read.message_id] = []
            readsMap[read.message_id].push(read)
          }
          set({ messageReads: readsMap })
        }
      }
    }
  },

  createDirectConversation: async (otherUserId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Check if DM already exists
    const existing = get().conversations.find((c) =>
      c.type === 'direct' && c.members?.some((m) => m.user_id === otherUserId)
    )
    if (existing) {
      await get().selectConversation(existing.id)
      return { error: null, conversation: existing }
    }

    const teamStore = (await import('./teamStore')).useTeamStore.getState()
    const team = teamStore.currentTeam
    if (!team) return { error: 'No team selected' }

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ type: 'direct', team_id: team.id, created_by: user.id })
      .select()
      .single()

    if (error) return { error: error.message }

    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUserId },
    ])

    await get().fetchConversations()
    await get().selectConversation(conv.id)
    return { error: null, conversation: conv as Conversation }
  },

  createGroupConversation: async (name, memberIds) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const teamStore = (await import('./teamStore')).useTeamStore.getState()
    const team = teamStore.currentTeam
    if (!team) return { error: 'No team selected' }

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ type: 'group', team_id: team.id, name, created_by: user.id })
      .select()
      .single()

    if (error) return { error: error.message }

    const allMembers = [...new Set([user.id, ...memberIds])]
    await supabase.from('conversation_members').insert(
      allMembers.map((uid) => ({ conversation_id: conv.id, user_id: uid }))
    )

    await get().fetchConversations()
    return { error: null }
  },

  sendMessage: async (content) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const conv = get().currentConversation
    if (!conv) return { error: 'No conversation selected' }

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conv.id, sender_id: user.id, content })
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .single()

    if (error) return { error: error.message }
    set((s) => ({ messages: [...s.messages, data as Message] }))
    return { error: null }
  },

  markRead: async (messageId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('message_reads').upsert({
      message_id: messageId, user_id: user.id, read_at: new Date().toISOString(),
    })
  },

  markAllRead: async (conversationId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all messages in this conversation not sent by current user
    const { data: unreadMsgs } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)

    if (!unreadMsgs?.length) return

    // Check which ones are already read
    const { data: existingReads } = await supabase
      .from('message_reads')
      .select('message_id')
      .eq('user_id', user.id)
      .in('message_id', unreadMsgs.map((m) => m.id))

    const readSet = new Set((existingReads || []).map((r) => r.message_id))
    const toMark = unreadMsgs.filter((m) => !readSet.has(m.id))

    if (!toMark.length) return

    await supabase.from('message_reads').insert(
      toMark.map((m) => ({
        message_id: m.id,
        user_id: user.id,
        read_at: new Date().toISOString(),
      }))
    )

    // Update unread count in conversation list
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    }))
  },

  subscribeToMessages: () => {
    const conv = get().currentConversation
    if (!conv) return () => {}

    // Subscribe to new messages
    const msgChannel = supabase
      .channel(`messages:${conv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            set((s) => {
              if (s.messages.some((m) => m.id === data.id)) return s
              return { messages: [...s.messages, data as Message] }
            })
            // Auto-mark incoming messages as read (we're viewing this conversation)
            const { data: { user } } = await supabase.auth.getUser()
            if (user && data.sender_id !== user.id) {
              await get().markRead(data.id)
            }
          }
        }
      )
      .subscribe()

    // Subscribe to read receipts for live tick updates
    const readChannel = supabase
      .channel(`reads:${conv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reads' },
        (payload) => {
          const read = payload.new as MessageRead
          set((s) => {
            const existing = s.messageReads[read.message_id] || []
            if (existing.some((r) => r.user_id === read.user_id)) return s
            return {
              messageReads: {
                ...s.messageReads,
                [read.message_id]: [...existing, read],
              },
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(readChannel)
    }
  },
}))
