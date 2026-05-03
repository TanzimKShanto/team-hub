'use client'
import { useEffect, useState } from 'react'
import useGoalStore from '@/store/goalStore'
import useWorkspaceStore from '@/store/workspaceStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Target, Calendar, User } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import { useRouter } from 'next/navigation'

const STATUS_COLORS = {
  NOT_STARTED: { bg: 'bg-muted', text: 'text-muted-foreground' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
  AT_RISK: { bg: 'bg-red-100', text: 'text-red-700' }
}

const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  AT_RISK: 'At Risk'
}

function CreateGoalDialog({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const createGoal = useGoalStore(s => s.createGoal)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setOpen(false)
    try {
      await createGoal({ title, description, dueDate })
      setTitle('')
      setDescription('')
      setDueDate('')
      onCreated?.()
    } catch {
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Launch v2.0" />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does success look like?" />
          </div>
          <div className="space-y-1.5">
            <Label>Due date <span className="text-muted-foreground">(optional)</span></Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GoalCard({ goal }) {
  const updateGoal = useGoalStore(s => s.updateGoal)
  const deleteGoal = useGoalStore(s => s.deleteGoal)
  const canDeleteAny = usePermission('goal:delete_any')
  const router = useRouter();

  const avgProgress = goal.milestones?.length
    ? Math.round(goal.milestones.reduce((sum, m) => sum + m.progress, 0) / goal.milestones.length)
    : 0

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/dashboard/goals/${goal.id}`)}
    >
      <CardHeader className="pb-2">
<div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Target className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm truncate min-w-0">{goal.title}</span>
            </div>
          <Select
            value={goal.status}
            onValueChange={val => updateGoal(goal.id, { status: val })}
            onClick={e => e.stopPropagation()}
          >
            <SelectTrigger className="w-32 h-7 text-xs cursor-pointer">
              <SelectValue>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[goal.status].bg} ${STATUS_COLORS[goal.status].text}`}>
                  {STATUS_LABELS[goal.status]}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val} className="text-xs">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[val].bg} ${STATUS_COLORS[val].text}`}>
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {goal.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        {goal.milestones?.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{goal.milestones.length} milestones</span>
              <span>{avgProgress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{goal.owner?.name}</span>
          </div>
          {goal.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {goal._count?.actionItems || 0} action items
          </span>
          {canDeleteAny && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteGoal(goal.id)
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function GoalsPage() {
  const { goals, fetchGoals, loading } = useGoalStore()
  const { activeWorkspace } = useWorkspaceStore()
  const canCreateGoal = usePermission('goal:create')


  useEffect(() => {
    if (activeWorkspace) fetchGoals()
  }, [activeWorkspace?.id])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">{goals.length} goals in this workspace</p>
        </div>
        {canCreateGoal && <CreateGoalDialog />}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Target className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No goals yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first goal to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}
    </div>
  )
}
