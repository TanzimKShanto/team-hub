import { create } from 'zustand'
import api from '@/lib/api'
import useWorkspaceStore from './workspaceStore'
import { toast } from 'sonner'

const useActionItemStore = create((set, get) => ({
  items: [],
  loading: false,

  fetchItems: async (filters = {}) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    if (!workspaceId) return
    set({ loading: true })
    try {
      const params = new URLSearchParams(filters).toString()
      const res = await api.get(`/workspaces/${workspaceId}/action-items?${params}`)
      set({ items: res.data.items, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createItem: async (data) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const res = await api.post(`/workspaces/${workspaceId}/action-items`, data)
    const item = res.data.item
    set(state => ({ items: [item, ...state.items] }))
    return item
  },

  // optimistic status update
  updateStatus: async (id, status) => {
    const previous = get().items
    set(state => ({
      items: state.items.map(i => i.id === id ? { ...i, status } : i)
    }))
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    try {
      await api.patch(`/workspaces/${workspaceId}/action-items/${id}`, { status })
    } catch {
      set({ items: previous })
      toast.error('Update failed, reverted')
    }
  },

  updateItem: async (id, data) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const res = await api.patch(`/workspaces/${workspaceId}/action-items/${id}`, data)
    set(state => ({
      items: state.items.map(i => i.id === id ? res.data.item : i)
    }))
    return res.data.item
  },

  deleteItem: async (id) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    await api.delete(`/workspaces/${workspaceId}/action-items/${id}`)
    set(state => ({ items: state.items.filter(i => i.id !== id) }))
  }
}))

export default useActionItemStore
