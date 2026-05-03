'use client'
import { useEffect, useState } from 'react'
import useWorkspaceStore from '@/store/workspaceStore'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Target, CheckSquare, AlertTriangle, TrendingUp, Download } from 'lucide-react'

const STATUS_COLORS = {
  NOT_STARTED: '#94a3b8',
  IN_PROGRESS: '#6366f1',
  COMPLETED: '#10b981',
  AT_RISK: '#ef4444'
}

const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  AT_RISK: 'At Risk'
}

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspaceStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!activeWorkspace) return
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/workspaces/${activeWorkspace.id}/analytics`)
        setData(res.data)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [activeWorkspace?.id])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await api.get(
        `/workspaces/${activeWorkspace.id}/analytics/export`,
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'workspace-export.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="h-28 animate-pulse bg-muted" />)}
        </div>
      </div>
    )
  }

  const { stats, chartData, statusChart } = data || {}

  const pieData = statusChart?.map(s => ({
    name: STATUS_LABELS[s.status],
    value: s.count,
    color: STATUS_COLORS[s.status]
  })) || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeWorkspace?.name} workspace overview
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-1.5"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Goals',
            value: stats?.totalGoals,
            icon: Target,
            color: 'text-indigo-500'
          },
          {
            label: 'Completed This Week',
            value: stats?.completedThisWeek,
            icon: TrendingUp,
            color: 'text-green-500'
          },
          {
            label: 'Overdue Goals',
            value: stats?.overdueGoals,
            icon: AlertTriangle,
            color: 'text-red-500'
          },
          {
            label: 'Item Completion Rate',
            value: `${stats?.completionRate ?? 0}%`,
            icon: CheckSquare,
            color: 'text-blue-500'
          }
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Goal completions chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Goal Completions — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Goal status pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Goals by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No goals yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action items summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Action Items Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats?.totalItems ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats?.completedItems ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-500">
              {(stats?.totalItems ?? 0) - (stats?.completedItems ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Remaining</div>
          </div>
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${stats?.completionRate ?? 0}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.completionRate ?? 0}% complete
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
