import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile } from '../types'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ initialized: true })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user, session })
        await get().fetchProfile(session.user.id)
      }
    } catch {
      // Supabase not reachable
    }
    set({ initialized: true })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null, session })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) set({ profile: data })
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true })
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    set({ loading: false })
    return { error: error?.message ?? null }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ loading: false })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },

  updateProfile: async (data) => {
    const userId = get().user?.id
    if (!userId) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
    if (!error) {
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...data } : null,
      }))
    }
    return { error: error?.message ?? null }
  },
}))
