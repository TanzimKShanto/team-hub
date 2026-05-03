import { create } from 'zustand'
import api from '@/lib/api'

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,  // { ...workspace, role, members }
  members: [],
  loading: false,

  fetchWorkspaces: async () => {
    set({ loading: true })
    try {
      const res = await api.get('/workspaces')
      const workspaces = res.data.workspaces
      set({ workspaces, loading: false })

      // auto-select first workspace if none active
      if (!get().activeWorkspace && workspaces.length > 0) {
        await get().switchWorkspace(workspaces[0].id)
      }
      return workspaces
    } catch {
      set({ loading: false })
      return []
    }
  },

  createWorkspace: async (data) => {
    const res = await api.post('/workspaces', data)
    const workspace = res.data.workspace
    set(state => ({ workspaces: [...state.workspaces, workspace] }))
    await get().switchWorkspace(workspace.id)
    return workspace
  },

  switchWorkspace: async (id) => {
    try {
      const res = await api.get(`/workspaces/${id}`)
      const workspace = res.data.workspace
      set({
        activeWorkspace: workspace,
        members: workspace.members || []
      })
    } catch (err) {
      console.error('Failed to switch workspace', err)
    }
  },

  inviteMember: async (email, role = 'MEMBER') => {
    const workspaceId = get().activeWorkspace?.id
    const res = await api.post(`/workspaces/${workspaceId}/invite`, { email, role })
    set(state => ({ members: [...state.members, res.data.member] }))
    return res.data.member
  },

  updateWorkspace: async (data) => {
    const workspaceId = get().activeWorkspace?.id
    const res = await api.patch(`/workspaces/${workspaceId}`, data)
    set(state => ({
      activeWorkspace: { ...state.activeWorkspace, ...res.data.workspace },
      workspaces: state.workspaces.map(w =>
        w.id === workspaceId ? { ...w, ...res.data.workspace } : w
      )
    }))
  },

  updateMemberRole: async (userId, role) => {
    const workspaceId = get().activeWorkspace?.id
    await api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role })
    set(state => ({
      members: state.members.map(m =>
        m.userId === userId || m.user?.id === userId ? { ...m, role } : m
      ),
      activeWorkspace: state.activeWorkspace ? {
        ...state.activeWorkspace,
        members: state.activeWorkspace.members.map(m =>
          m.userId === userId || m.user?.id === userId ? { ...m, role } : m
        )
      } : null
    }))
  }
}))

export default useWorkspaceStore
