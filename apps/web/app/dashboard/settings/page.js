'use client'
import { useState, useRef } from 'react'
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
import { Camera, Trash2, Settings2 } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import usePermissionStore from '@/store/permissionStore'
import Link from 'next/link'

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
]

function ProfileSection() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const [name, setName] = useState(user?.name || '')
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileRef = useRef()

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.patch('/profile', { name })
      setUser(res.data.user)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await api.post('/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUser(res.data.user)
      toast.success('Avatar updated')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your name and avatar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-primary hover:underline mt-1"
            >
              {avatarLoading ? 'Uploading...' : 'Change avatar'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <Separator />

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email} disabled className="text-muted-foreground" />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function RoleSection() {
  const { role, permissions } = usePermissionStore()

  const PERMISSION_LABELS = {
    'announcement:create': 'Post announcements',
    'workspace:invite': 'Invite members',
    'goal:delete_any': 'Delete any goal',
    'workspace:change_role': 'Change member roles',
    'goal:create': 'Create goals',
    'actionitem:create': 'Create action items',
    'reaction:create': 'React to posts',
    'comment:create': 'Comment on posts',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Your Role
          <Badge variant={role === 'ADMIN' ? 'default' : 'secondary'}>
            {role}
          </Badge>
        </CardTitle>
        <CardDescription>
          Permissions granted to your role in this workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            {permissions.includes(key) ? (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                Allowed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Restricted
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch('/profile/password', {
        currentPassword: current,
        newPassword: next
      })
      toast.success('Password updated')
      setCurrent('')
      setNext('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input
              type="password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input
              type="password"
              value={next}
              onChange={e => setNext(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function WorkspaceSection() {
  const { activeWorkspace } = useWorkspaceStore()

  return (
    <Link href="/dashboard/settings/workspace">
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Workspace Settings</CardTitle>
            <CardDescription>Manage workspace, members & roles</CardDescription>
          </div>
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: activeWorkspace?.accentColor || '#6366f1' }}
            />
            <span className="text-sm font-medium">{activeWorkspace?.name}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and workspace
        </p>
      </div>
      <ProfileSection />
      <PasswordSection />
      <RoleSection />
      <WorkspaceSection />
    </div>
  )
}
