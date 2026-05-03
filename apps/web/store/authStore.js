import { create } from 'zustand'
import api from '@/lib/api'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  hydrated: false,

  setUser: (user) => set({ user }),

  hydrate: async () => {
    if (get().hydrated) return
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data.user, loading: false, hydrated: true })
    } catch {
      set({ user: null, loading: false, hydrated: true })
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    set({ user: res.data.user })
    return res.data.user
  },

  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    set({ user: res.data.user })
    return res.data.user
  },

  logout: async () => {
    await api.post('/auth/logout')
    set({ user: null, hydrated: false })
  }
}))

export default useAuthStore
