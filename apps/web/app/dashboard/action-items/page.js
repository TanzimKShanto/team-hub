'use client'
import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import useActionItemStore from '@/store/actionItemStore'
import useWorkspaceStore from '@/store/workspaceStore'
import useGoalStore from '@/store/goalStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, CheckSquare, GripVertical, Pencil, Trash2, Target, Calendar, User } from 'lucide-react'

const PRIORITY_COLORS = { LOW: 'secondary', MEDIUM: 'default', HIGH: 'destructive' }
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }

function toDateInputValue(date) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

// ── Create Dialog ────────────────────────────────────────────────────────────
function CreateItemDialog({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [goalId, setGoalId] = useState('')
  const [loading, setLoading] = useState(false)

  const createItem = useActionItemStore(s => s.createItem)
  const members = useWorkspaceStore(s => s.members)
  const goals = useGoalStore(s => s.goals)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createItem({
        title,
        assigneeId: assigneeId || null,
        priority,
        dueDate: dueDate || null,
        goalId: goalId || null,
      })
      setOpen(false)
      setTitle('')
      setAssigneeId('')
      setPriority('MEDIUM')
      setDueDate('')
      setGoalId('')
      onCreated?.()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Action Item</DialogTitle>
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
            <Label>
              Link to Goal <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select value={goalId || 'none'} onValueChange={v => setGoalId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="No goal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No goal</SelectItem>
                {(goals || []).map(goal => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Assignee <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select
              value={assigneeId || 'unassigned'}
              onValueChange={v => setAssigneeId(v === 'unassigned' ? '' : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map(member => {
                  const user = member.user || member
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
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
            <Label>
              Due date <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Item'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Dialog ──────────────────────────────────────────────────────────────
function EditItemDialog({ item }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [assigneeId, setAssigneeId] = useState(item.assignee?.id || '')
  const [priority, setPriority] = useState(item.priority)
  const [status, setStatus] = useState(item.status)
  const [dueDate, setDueDate] = useState(toDateInputValue(item.dueDate))
  const [goalId, setGoalId] = useState(item.goal?.id || '')
  const [loading, setLoading] = useState(false)

  const updateItem = useActionItemStore(s => s.updateItem)
  const members = useWorkspaceStore(s => s.members)
  const goals = useGoalStore(s => s.goals)

  const resetForm = () => {
    setTitle(item.title)
    setAssigneeId(item.assignee?.id || '')
    setPriority(item.priority)
    setStatus(item.status)
    setDueDate(toDateInputValue(item.dueDate))
    setGoalId(item.goal?.id || '')
  }

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) resetForm()
    setOpen(nextOpen)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateItem(item.id, {
        title,
        assigneeId: assigneeId || null,
        priority,
        status,
        dueDate: dueDate || null,
        goalId: goalId || null,
      })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Action Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>
              Link to Goal <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select value={goalId || 'none'} onValueChange={v => setGoalId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="No goal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No goal</SelectItem>
                {(goals || []).map(goal => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Assignee <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select
              value={assigneeId || 'unassigned'}
              onValueChange={v => setAssigneeId(v === 'unassigned' ? '' : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map(member => {
                  const user = member.user || member
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label>
              Due date <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Draggable Card ───────────────────────────────────────────────────────────
function DraggableCard({ item, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })
  const updateStatus = useActionItemStore(s => s.updateStatus)
  const deleteItem = useActionItemStore(s => s.deleteItem)

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date()
  const dueDateStr = item.dueDate
    ? new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${isDragging && !overlay ? 'opacity-40 shadow-none' : 'hover:shadow-md'
        } ${overlay ? 'shadow-xl rotate-1 scale-105' : ''}`}
    >
      <CardContent className="p-3 py-0 space-y-2">
        {/* Top row: goal badge + date */}
        <div className={`flex items-center gap-2 ${item.goal ? 'justify-between' : 'justify-end'} w-full`}>
          {item.goal && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
              <Target className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{item.goal.title}</span>
            </div>
          )}
          {dueDateStr && (
            <span className={`text-[10px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {dueDateStr}
            </span>
          )}
        </div>

        {/* Title + actions row */}
        <div className="flex items-start gap-2">
          <GripVertical
            {...listeners}
            {...attributes}
            className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0 cursor-grab"
          />
          <p className="text-sm font-medium flex-1 leading-snug">{item.title}</p>

          {!overlay && (
            <div className="flex items-center gap-1 shrink-0">
              <EditItemDialog item={item} />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Bottom: assignee + priority + status + due date */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {item.assignee ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={item.assignee.avatar} />
                <AvatarFallback className="text-[10px]">{item.assignee.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{item.assignee.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/50">Unassigned</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant={PRIORITY_COLORS[item.priority]} className="text-[10px]">
              {item.priority}
            </Badge>
            <Select value={item.status} onValueChange={val => updateStatus(item.id, val)}>
              <SelectTrigger className="h-5 w-24 text-[10px] py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="text-xs py-1">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}

// ── Droppable Column ─────────────────────────────────────────────────────────
function DroppableColumn({ status, items }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-24 rounded-lg p-2 transition-colors ${isOver ? 'bg-muted/60' : ''
        }`}
    >
      {items.map(item => (
        <DraggableCard key={item.id} item={item} />
      ))}
    </div>
  )
}

// ── Kanban View ──────────────────────────────────────────────────────────────
function KanbanView({ items }) {
  const updateStatus = useActionItemStore(s => s.updateStatus)
  const [activeItem, setActiveItem] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = ({ active }) => {
    setActiveItem(items.find(i => i.id === active.id) || null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveItem(null)
    if (!over) return
    const newStatus = STATUSES.find(s => s === over.id)
    if (newStatus && active.id) {
      const item = items.find(i => i.id === active.id)
      if (item && item.status !== newStatus) {
        updateStatus(active.id, newStatus)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-4">
        {STATUSES.map(status => {
          const col = items.filter(i => i.status === status)
          return (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{STATUS_LABELS[status]}</span>
                <Badge variant="secondary" className="text-xs">{col.length}</Badge>
              </div>
              <DroppableColumn status={status} items={col} />
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeItem ? <DraggableCard item={activeItem} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

// ── List View ────────────────────────────────────────────────────────────────
function ListView({ items }) {
  const updateStatus = useActionItemStore(s => s.updateStatus)
  const deleteItem = useActionItemStore(s => s.deleteItem)

  return (
    <div className="space-y-2">
      {items.map(item => (
        <Card key={item.id}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.assignee && (
                  <p className="text-xs text-muted-foreground">{item.assignee.name}</p>
                )}
                {item.goal && (
                  <p className="text-xs text-muted-foreground truncate">· 🎯 {item.goal.title}</p>
                )}
                {item.dueDate && (
                  <p className={`text-xs ${new Date(item.dueDate) < new Date() ? 'text-destructive' : 'text-muted-foreground'}`}>
                    · {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={PRIORITY_COLORS[item.priority]} className="text-xs shrink-0">
              {item.priority}
            </Badge>
            <Select value={item.status} onValueChange={val => updateStatus(item.id, val)}>
              <SelectTrigger className="h-7 w-32 text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="text-sm">{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <EditItemDialog item={item} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
              onClick={() => deleteItem(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ActionItemsPage() {
  const { items, fetchItems, loading } = useActionItemStore()
  const { activeWorkspace } = useWorkspaceStore()
  const fetchGoals = useGoalStore(s => s.fetchGoals)
  const [view, setView] = useState('kanban')

  useEffect(() => {
    if (activeWorkspace) {
      fetchItems()
      fetchGoals()
    }
  }, [activeWorkspace?.id])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Action Items</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} items total</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="h-8">
              <TabsTrigger value="kanban" className="text-xs px-3">Kanban</TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-3">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <CreateItemDialog />
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse bg-muted rounded-lg" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <CheckSquare className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No action items yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first action item to get started</p>
        </div>
      ) : view === 'kanban' ? (
        <KanbanView items={items} />
      ) : (
        <ListView items={items} />
      )}
    </div>
  )
}
