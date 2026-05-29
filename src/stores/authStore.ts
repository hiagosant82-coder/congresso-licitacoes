import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { trackLogout } from '../lib/tracking'
import type { Profile } from '../types'

interface AuthState {
  user: Profile | null
  session: boolean
  loading: boolean
  setUser: (user: Profile | null) => void
  fetchProfile: (userId: string) => Promise<void>
  ensureOrganization: () => Promise<string | null>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: false,
  loading: true,

  setUser: (user) => set({ user }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      set({ user: null, session: false, loading: false })
      return
    }

    set({ user: data as Profile, session: true, loading: false })
  },

  ensureOrganization: async () => {
    const profile = get().user
    if (!profile) return null
    if (profile.organization_id) return profile.organization_id

    if (profile.role !== 'admin' && profile.role !== 'operator') return null

    const orgName = import.meta.env.VITE_ORGANIZATION_NAME || 'Envolve Mato Grosso'

    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', orgName)
      .maybeSingle()

    let orgId: string

    if (existing) {
      orgId = existing.id
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName, plan: 'gratuito' })
        .select('id')
        .single()

      if (orgError) {
        console.error('Erro ao criar organização:', orgError.message)
        return null
      }

      orgId = newOrg.id
    }

    await supabase
      .from('profiles')
      .update({ organization_id: orgId })
      .eq('id', profile.id)

    set({ user: { ...profile, organization_id: orgId } })

    if (!import.meta.env.VITE_ORGANIZATION_ID) {
      console.log(`VITE_ORGANIZATION_ID=${orgId}`)
    }

    return orgId
  },

  signOut: async () => {
    const userId = get().user?.id
    const orgId = get().user?.organization_id
    if (userId && orgId) {
      await trackLogout(userId, orgId)
    }
    await supabase.auth.signOut()
    set({ user: null, session: false, loading: false })
  },

  initialize: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      await get().fetchProfile(data.session.user.id)
    } else {
      set({ loading: false })
    }
  },
}))
