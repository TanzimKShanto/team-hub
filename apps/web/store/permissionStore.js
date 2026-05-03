import { create } from 'zustand'
import api from '@/lib/api'
import useWorkspaceStore from './workspaceStore'

const usePermissionStore = create((set, get) => ({
  permissions: [],
  role: null,

  fetchPermissions: async () => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    if (!workspaceId) return
    try {
      const res = await api.get(`/workspaces/${workspaceId}/permissions`)
      set({ permissions: res.data.permissions, role: res.data.role })
    } catch { }
  },

  can: (permission) => {
    return get().permissions.includes(permission)
  }
}))

export default usePermissionStore
