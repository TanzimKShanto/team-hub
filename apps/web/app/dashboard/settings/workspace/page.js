'use client'
import { useState } from 'react'
import useAuthStore from '@/store/authStore'
import useWorkspaceStore from '@/store/workspaceStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePermission } from '@/hooks/usePermission'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
]

export default function WorkspaceSettingsPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const { activeWorkspace, members, inviteMember, updateWorkspace, updateMemberRole } = useWorkspaceStore()
  const [name, setName] = useState(activeWorkspace?.name || '')
  const [description, setDescription] = useState(activeWorkspace?.description || '')
  const [accentColor, setAccentColor] = useState(activeWorkspace?.accentColor || '#6366f1')
  const [inviteEmail, setInviteEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)
  const canInvite = usePermission('workspace:invite')
  const canUpdateWorkspace = usePermission('workspace:update')
  const canChangeRole = usePermission('workspace:change_role')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateWorkspace({ name, description, accentColor })
      toast.success('Workspace updated')
    } catch {
      toast.error('Failed to update workspace')
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    try {
      await inviteMember(inviteEmail)
      toast.success(`Invited ${inviteEmail}`)
      setInviteEmail('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Workspace Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage {activeWorkspace?.name} workspace
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Details</CardTitle>
          <CardDescription>Basic information about your workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canUpdateWorkspace ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Workspace name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's this workspace for?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Accent color</Label>
                <div className="flex gap-2">
                  {ACCENT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccentColor(color)}
                      className="w-6 h-6 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: color,
                        borderColor: accentColor === color ? 'white' : 'transparent',
                        outline: accentColor === color ? `2px solid ${color}` : 'none',
                        outlineOffset: '2px'
                      }}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save workspace'}
              </Button>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="font-medium">{name}</span>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {canUpdateWorkspace && canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Members</CardTitle>
            <CardDescription>Add members to your workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={inviting}>
                {inviting ? 'Inviting...' : 'Invite'}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              They must already have an account to be invited.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>People in this workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map(m => {
            const memberUserId = m.user?.id || m.userId
            const isCurrentUser = memberUserId === user?.id

            return (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.user?.avatar} />
                    <AvatarFallback className="text-xs">
                      {m.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                  </div>
                </div>
                {canChangeRole && !isCurrentUser ? (
                  <Select value={m.role} onValueChange={(role) => updateMemberRole(memberUserId, role)}>
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN" className="text-xs">Admin</SelectItem>
                      <SelectItem value="MEMBER" className="text-xs">Member</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={m.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                    {m.role}
                  </Badge>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}