import { create } from 'zustand'
import api from '@/lib/api'
import useWorkspaceStore from './workspaceStore'

const useGoalStore = create((set, get) => ({
  goals: [],
  activeGoal: null,
  loading: false,

  fetchGoals: async () => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    if (!workspaceId) return
    set({ loading: true })
    try {
      const res = await api.get(`/workspaces/${workspaceId}/goals`)
      set({ goals: res.data.goals, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createGoal: async (data) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const tempId = `temp-${Date.now()}`
    const tempGoal = { id: tempId, ...data, status: 'NOT_STARTED', createdAt: new Date().toISOString() }
    set(state => ({ goals: [tempGoal, ...state.goals] }))
    try {
      const res = await api.post(`/workspaces/${workspaceId}/goals`, data)
      const goal = res.data.goal
      set(state => ({
        goals: state.goals.map(g => g.id === tempId ? goal : g)
      }))
      return goal
    } catch {
      set(state => ({ goals: state.goals.filter(g => g.id !== tempId) }))
      throw new Error('Create failed')
    }
  },

  updateGoal: async (id, data) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    // optimistic update
    const previous = get().goals
    set(state => ({
      goals: state.goals.map(g => g.id === id ? { ...g, ...data } : g)
    }))
    try {
      const res = await api.patch(`/workspaces/${workspaceId}/goals/${id}`, data)
      set(state => ({
        goals: state.goals.map(g => g.id === id ? res.data.goal : g)
      }))
    } catch {
      // revert on failure
      set({ goals: previous })
      throw new Error('Update failed')
    }
  },

  deleteGoal: async (id) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    await api.delete(`/workspaces/${workspaceId}/goals/${id}`)
    set(state => ({ goals: state.goals.filter(g => g.id !== id) }))
  },

  fetchGoal: async (id) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const res = await api.get(`/workspaces/${workspaceId}/goals/${id}`)
    set({ activeGoal: res.data.goal })
    return res.data.goal
  },

  addMilestone: async (goalId, data) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const res = await api.post(`/workspaces/${workspaceId}/goals/${goalId}/milestones`, data)
    set(state => ({
      goals: state.goals.map(g =>
        g.id === goalId ? { ...g, milestones: [...(g.milestones || []), res.data.milestone] } : g
      )
    }))
    return res.data.milestone
  },

  updateMilestone: async (goalId, milestoneId, data) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const res = await api.patch(
      `/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`,
      data
    )
    set(state => ({
      goals: state.goals.map(g =>
        g.id === goalId
          ? { ...g, milestones: g.milestones.map(m => m.id === milestoneId ? res.data.milestone : m) }
          : g
      )
    }))
  },

  postUpdate: async (goalId, content) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const res = await api.post(`/workspaces/${workspaceId}/goals/${goalId}/updates`, { content })
    return res.data.update
  }
}))

export default useGoalStore
