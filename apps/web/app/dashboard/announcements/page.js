'use client'
import { useEffect, useState, useRef } from 'react'
import useAnnouncementStore from '@/store/announcementStore'
import useWorkspaceStore from '@/store/workspaceStore'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pin, Megaphone, Send } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'

const EMOJIS = ['👍', '❤️', '🎉', '🔥', '👀', '✅']

function ReactionBar({ announcement }) {
  const user = useAuthStore(s => s.user)
  const toggleReaction = useAnnouncementStore(s => s.toggleReaction)

  const grouped = EMOJIS.reduce((acc, emoji) => {
    const count = announcement.reactions.filter(r => r.emoji === emoji).length
    if (count > 0) acc[emoji] = count
    return acc
  }, {})

  const myReactions = announcement.reactions
    .filter(r => r.userId === user?.id)
    .map(r => r.emoji)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(grouped).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(announcement.id, emoji, user?.id)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${myReactions.includes(emoji)
            ? 'bg-primary/10 border-primary/30'
            : 'bg-muted border-transparent hover:border-border'
            }`}
        >
          {emoji} {count}
        </button>
      ))}
      {EMOJIS.map(emoji => !grouped[emoji] && (
        <button
          key={emoji}
          onClick={() => toggleReaction(announcement.id, emoji, user?.id)}
          className="px-2 py-0.5 rounded-full text-xs border border-transparent hover:border-border hover:bg-muted transition-colors opacity-50 hover:opacity-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

function CommentSection({ announcement }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [mentionSearch, setMentionSearch] = useState(null) // null = closed
  const [cursorPos, setCursorPos] = useState(0)
  const inputRef = useRef(null)
  const addComment = useAnnouncementStore(s => s.addComment)
  const user = useAuthStore(s => s.user)
  const { members } = useWorkspaceStore()

  // detect @ typing
  const handleChange = (e) => {
    const val = e.target.value
    const cursor = e.target.selectionStart
    setContent(val)
    setCursorPos(cursor)

    // find if cursor is inside an @mention
    const textUpToCursor = val.slice(0, cursor)
    const mentionMatch = textUpToCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1].toLowerCase()) // search term after @
    } else {
      setMentionSearch(null)
    }
  }

  // filter members by search term
  const filteredMembers = mentionSearch !== null
    ? members.filter(m =>
      m.user?.name?.toLowerCase().includes(mentionSearch) &&
      m.user?.id !== user?.id
    )
    : []

  // insert mention when clicked (store user ID, render as name)
  const insertMention = (member) => {
    const textUpToCursor = content.slice(0, cursorPos)
    const textAfterCursor = content.slice(cursorPos)

    // replace @searchterm with @user_{id}
    const userId = member.user?.id || member.id
    const userName = member.user?.name || member.name
    const replaced = textUpToCursor.replace(/@(\w*)$/, `@user_${userId} `)
    const newContent = replaced + textAfterCursor

    setContent(newContent)
    setMentionSearch(null)

    // refocus input
    setTimeout(() => {
      inputRef.current?.focus()
      const newCursor = replaced.length
      inputRef.current?.setSelectionRange(newCursor, newCursor)
    }, 0)
  }

  const handleKeyDown = (e) => {
    // close mention dropdown on Escape
    if (e.key === 'Escape') setMentionSearch(null)
    // submit on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey && mentionSearch === null) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!content.trim()) return
    const commentContent = content
    setContent('') // Clear input immediately
    setMentionSearch(null)
    setLoading(true)
    try {
      await addComment(announcement.id, commentContent)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 mt-3 pt-3 border-t">
      {/* existing comments */}
      {announcement.comments.map(c => (
        <div key={c.id} className="flex gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={c.author?.avatar} />
            <AvatarFallback className="text-xs">
              {c.author?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="bg-muted rounded-lg px-3 py-1.5 flex-1">
            <p className="text-xs font-medium">{c.author?.name}</p>
            {/* highlight mentions in rendered comment */}
            <p className="text-xs mt-0.5">
              {c.content.split(/(@user_\w+)/g).map((part, i) => {
                if (part.startsWith('@user_')) {
                  const userId = part.replace('@user_', '')
                  const member = members.find(m => (m.user?.id || m.id) === userId)
                  const displayName = member?.user?.name || member?.name || part
                  return <span key={i} className="text-primary font-medium">@{displayName}</span>
                }
                return part
              })}
            </p>
          </div>
        </div>
      ))}

      {/* input with mention autocomplete */}
      <div className="flex gap-2 relative">
        <Avatar className="h-6 w-6 shrink-0 mt-1">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="text-xs">
            {user?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          {/* mention dropdown */}
          {mentionSearch !== null && filteredMembers.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 bg-popover border rounded-lg shadow-md z-50 min-w-40 overflow-hidden">
              {filteredMembers.map(m => (
                <button
                  key={m.user?.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault() // prevent input blur
                    insertMention(m)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left transition-colors"
                >
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage src={m.user?.avatar} />
                    <AvatarFallback className="text-xs">
                      {m.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{m.user?.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... type @ to mention"
              className="flex-1 text-xs bg-muted rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              disabled={loading || !content.trim()}
              onClick={handleSubmit}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnnouncementCard({ announcement }) {
  const { activeWorkspace } = useWorkspaceStore()
  const togglePin = useAnnouncementStore(s => s.togglePin)
  const [showComments, setShowComments] = useState(false)
  const canPin = usePermission('announcement:pin')

  return (
    <Card className={announcement.isPinned ? 'border-primary/30 bg-primary/5' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={announcement.author?.avatar} />
              <AvatarFallback className="text-xs">
                {announcement.author?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{announcement.author?.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(announcement.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {announcement.isPinned && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </Badge>
            )}
            {canPin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => togglePin(announcement.id)}
              >
                <Pin className={`h-3.5 w-3.5 ${announcement.isPinned ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
        <ReactionBar announcement={announcement} />
        <button
          onClick={() => setShowComments(v => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {announcement.comments.length} comment{announcement.comments.length !== 1 ? 's' : ''} ·{' '}
          {showComments ? 'hide' : 'show'}
        </button>
        {showComments && <CommentSection announcement={announcement} />}
      </CardContent>
    </Card>
  )
}

function CreateAnnouncementForm() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const createAnnouncement = useAnnouncementStore(s => s.createAnnouncement)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    const announcementContent = content
    setContent('') // Clear immediately
    setLoading(true)
    try {
      await createAnnouncement(announcementContent)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write an announcement for your team..."
            className="resize-none text-sm"
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={loading || !content.trim()}>
              {loading ? 'Posting...' : 'Post Announcement'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function AnnouncementsPage() {
  const { announcements, fetchAnnouncements, loading, onlineUserIds } = useAnnouncementStore()
  const { activeWorkspace, members } = useWorkspaceStore()
  const canPost = usePermission('announcement:create')
  const canPin = usePermission('announcement:pin')

  useEffect(() => {
    if (activeWorkspace) fetchAnnouncements()
  }, [activeWorkspace?.id])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {onlineUserIds.length} member{onlineUserIds.length !== 1 ? 's' : ''} online
          </p>
        </div>
        <div className="flex gap-1.5">
          {members.slice(0, 5).map(m => (
            <div key={m.id} className="relative">
              <Avatar className="h-7 w-7">
                <AvatarImage src={m.user?.avatar} />
                <AvatarFallback className="text-xs">{m.user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              {onlineUserIds.includes(m.user?.id) && (
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-background" />
              )}
            </div>
          ))}
        </div>
      </div>

      {canPost && <CreateAnnouncementForm />}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No announcements yet</p>
          {canPin && <p className="text-sm text-muted-foreground mt-1">Post the first one above</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => <AnnouncementCard key={a.id} announcement={a} />)}
        </div>
      )}
    </div>
  )
}
