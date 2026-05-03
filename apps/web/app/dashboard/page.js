'use client'
import { useEffect, useState } from 'react'
import useAuthStore from '@/store/authStore'
import useWorkspaceStore from '@/store/workspaceStore'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, CheckSquare, Users, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const { activeWorkspace, members } = useWorkspaceStore()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!activeWorkspace) return
    api.get(`/workspaces/${activeWorkspace.id}/analytics`)
      .then(res => setStats(res.data.stats))
      .catch(() => { })
  }, [activeWorkspace?.id])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Good day, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeWorkspace?.name} workspace
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Goals', value: stats?.totalGoals, icon: Target, color: 'text-indigo-500' },
          { label: 'Completed This Week', value: stats?.completedThisWeek, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Overdue', value: stats?.overdueGoals, icon: CheckSquare, color: 'text-red-500' },
          { label: 'Members', value: members.length, icon: Users, color: 'text-blue-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value ?? '—'}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Workspace Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {m.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                </div>
              </div>
              <Badge variant={m.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                {m.role}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
