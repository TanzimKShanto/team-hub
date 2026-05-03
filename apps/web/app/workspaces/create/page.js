'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useWorkspaceStore from '@/store/workspaceStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
]

export default function CreateWorkspacePage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const { workspaces, fetchWorkspaces, createWorkspace } = useWorkspaceStore()
  const router = useRouter()

  useEffect(() => {
    const checkWorkspaces = async () => {
      await fetchWorkspaces()
      setChecking(false)
    }
    checkWorkspaces()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createWorkspace({ name, description, accentColor })
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your workspace</CardTitle>
          <CardDescription>Set up a space for your team to collaborate</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Workspace name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Acme Engineering"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What's this workspace for?"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Accent color</Label>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className="w-7 h-7 rounded-full border-2 transition-all"
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

            {/* Preview */}
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/40">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: accentColor }} />
              <span className="text-sm font-medium">{name || 'Workspace name'}</span>
            </div>

            <div className="flex gap-2">
              {workspaces.length > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create workspace'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}