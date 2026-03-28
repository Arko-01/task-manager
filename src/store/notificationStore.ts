import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Notification } from '../types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>
  subscribeToNotifications: () => () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    set({ loading: true })
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const notifications = (data as Notification[]) || []
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
      loading: false,
    })
  },

  markRead: async (notificationId) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  markAllRead: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  subscribeToNotifications: () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user || payload.new.user_id !== user.id) return
          const notification = payload.new as Notification
          set((s) => ({
            notifications: [notification, ...s.notifications],
            unreadCount: s.unreadCount + 1,
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },
}))
