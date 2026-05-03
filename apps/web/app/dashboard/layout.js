'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useWorkspaceStore from '@/store/workspaceStore'
import useAuthStore from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import usePermissionStore from '@/store/permissionStore'

export default function DashboardLayout({ children }) {
  const { fetchWorkspaces, activeWorkspace, loading } = useWorkspaceStore()
  const user = useAuthStore(s => s.user)
  const router = useRouter()
  const fetchPermissions = usePermissionStore(s => s.fetchPermissions)

  useEffect(() => {
    const init = async () => {
      const workspaces = await fetchWorkspaces()
      if (workspaces.length === 0) {
        router.push('/workspaces/create')
      } else {
        await fetchPermissions()  // fetch after workspace loads
      }
    }
    if (user) init()
  }, [user])

  useEffect(() => {
    const init = async () => {
      const workspaces = await fetchWorkspaces()
      if (workspaces.length === 0) {
        router.push('/workspaces/create')
      }
    }
    if (user) init()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading workspace...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
