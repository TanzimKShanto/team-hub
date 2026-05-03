'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useGoalStore from '@/store/goalStore'
import useWorkspaceStore from '@/store/workspaceStore'
import useActionItemStore from '@/store/actionItemStore'
import { usePermission } from '@/hooks/usePermission'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  ArrowLeft, Target, Calendar, User, Plus,
  CheckSquare, Flag, Pencil, Trash2, Send
} from 'lucide-react'

const STATUS_COLORS = {
  NOT_STARTED: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  AT_RISK: 'destructive'
}

const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  AT_RISK: 'At Risk'
}

const PRIORITY_COLORS = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'destructive'
}

// ─── Milestone Card ───────────────────────────────────────────────────────────
function MilestoneItem({ milestone, goalId }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(milestone.title)
  const [progress, setProgress] = useState(milestone.progress)
  const [saving, setSaving] = useState(false)
  const updateMilestone = useGoalStore(s => s.updateMilestone)
  const canUpdate = usePermission('milestone:update')

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateMilestone(goalId, milestone.id, { title, progress })
      setEditing(false)
      toast.success('Milestone updated')
    } catch {
      toast.error('Failed to update milestone')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      {editing ? (
        <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-sm"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-16 shrink-0">
              Progress: {progress}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={e => setProgress(parseInt(e.target.value))}
              className="flex-1 accent-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 group">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">{milestone.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{milestone.progress}%</span>
                {canUpdate && (
                  <button
                    onClick={() => setEditing(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${milestone.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Milestone Dialog ─────────────────────────────────────────────────────
function AddMilestoneDialog({ goalId }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const addMilestone = useGoalStore(s => s.addMilestone)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addMilestone(goalId, { title, progress })
      setOpen(false)
      setTitle('')
      setProgress(0)
      toast.success('Milestone added')
    } catch {
      toast.error('Failed to add milestone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="e.g. Backend API complete"
            />
          </div>
          <div className="space-y-2">
            <Label>Initial progress: {progress}%</Label>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={e => setProgress(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Milestone'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add Action Item Dialog ───────────────────────────────────────────────────
function AddActionItemDialog({ goalId }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const createItem = useActionItemStore(s => s.createItem)
  const { members } = useWorkspaceStore()
  const [assigneeId, setAssigneeId] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createItem({ title, priority, dueDate, goalId, assigneeId: assigneeId || null })
      setOpen(false)
      setTitle('')
      setPriority('MEDIUM')
      setDueDate('')
      setAssigneeId('')
      toast.success('Action item added')
    } catch {
      toast.error('Failed to add action item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add action item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Action Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="What needs to be done?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assignee <span className="text-muted-foreground">(optional)</span></Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.user?.id} value={m.user?.id}>
                    {m.user?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Due date <span className="text-muted-foreground">(optional)</span></Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Item'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({ goal, goalId }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [updates, setUpdates] = useState(goal?.updates || [])
  const postUpdate = useGoalStore(s => s.postUpdate)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      const update = await postUpdate(goalId, content)
      setUpdates(prev => [update, ...prev])
      setContent('')
      toast.success('Update posted')
    } catch {
      toast.error('Failed to post update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Post a progress update..."
          className="flex-1 text-sm"
        />
        <Button type="submit" size="icon" disabled={loading || !content.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-3">
        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No updates yet — post the first one above
          </p>
        ) : (
          updates.map((u, i) => (
            <div key={u.id || i} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{u.content}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(u.createdAt).toLocaleDateString('en', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GoalDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { activeWorkspace } = useWorkspaceStore()
  const { fetchGoal, updateGoal, activeGoal } = useGoalStore()
  const { fetchItems, items, updateStatus } = useActionItemStore()
  const canCreateMilestone = usePermission('milestone:create')
  const canCreateItem = usePermission('actionitem:create')
  const canUpdateGoal = usePermission('goal:update_any')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeWorkspace || !id) return
    const init = async () => {
      setLoading(true)
      await Promise.all([
        fetchGoal(id),
        fetchItems({ goalId: id })
      ])
      setLoading(false)
    }
    init()
  }, [id, activeWorkspace?.id])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!activeGoal) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Goal not found</p>
        <Button variant="ghost" onClick={() => router.push('/dashboard/goals')} className="mt-2">
          Back to goals
        </Button>
      </div>
    )
  }

  const goal = activeGoal
  const goalItems = items.filter(i => i.goal?.id === id)
  const avgProgress = goal.milestones?.length
    ? Math.round(goal.milestones.reduce((sum, m) => sum + m.progress, 0) / goal.milestones.length)
    : 0

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push('/dashboard/goals')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold truncate">{goal.title}</h1>
            <Select
              value={goal.status}
              onValueChange={val => updateGoal(goal.id, { status: val })}
              disabled={!canUpdateGoal}
            >
              <SelectTrigger className="w-36 h-7 text-xs">
                <SelectValue>
                  <Badge variant={STATUS_COLORS[goal.status]} className="text-xs">
                    {STATUS_LABELS[goal.status]}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {goal.description && (
            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{goal.owner?.name}</span>
            </div>
            {goal.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due {new Date(goal.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall progress */}
      {goal.milestones?.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{avgProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — milestones + action items */}
        <div className="lg:col-span-2 space-y-6">

          {/* Milestones */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  Milestones ({goal.milestones?.length || 0})
                </CardTitle>
                {canCreateMilestone && <AddMilestoneDialog goalId={goal.id} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.milestones?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No milestones yet
                </p>
              ) : (
                goal.milestones.map(m => (
                  <MilestoneItem key={m.id} milestone={m} goalId={goal.id} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  Action Items ({goalItems.length})
                </CardTitle>
                {canCreateItem && <AddActionItemDialog goalId={goal.id} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {goalItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No action items linked to this goal
                </p>
              ) : (
                goalItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Select value={item.status} onValueChange={val => updateStatus(item.id, val)}>
                      <SelectTrigger className={`h-6 w-28 text-xs ${item.status === 'DONE' ? 'line-through' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO" className="text-xs">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS" className="text-xs">In Progress</SelectItem>
                        <SelectItem value="DONE" className="text-xs">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className={`flex-1 text-sm ${item.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </span>
                    <Badge variant={PRIORITY_COLORS[item.priority]} className="text-xs shrink-0">
                      {item.priority}
                    </Badge>
                    {item.assignee && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {item.assignee.name}
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — activity feed */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed goal={goal} goalId={goal.id} />
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total items</span>
                <span className="font-medium">{goalItems.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-500">
                  {goalItems.filter(i => i.status === 'DONE').length}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">In progress</span>
                <span className="font-medium text-indigo-500">
                  {goalItems.filter(i => i.status === 'IN_PROGRESS').length}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Milestones</span>
                <span className="font-medium">{goal.milestones?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
