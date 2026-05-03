import { create } from 'zustand'
import api from '@/lib/api'
import useWorkspaceStore from './workspaceStore'
import useAuthStore from './authStore'

const useAnnouncementStore = create((set, get) => ({
  announcements: [],
  loading: false,
  onlineUserIds: [],

  fetchAnnouncements: async () => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    if (!workspaceId) return
    set({ loading: true })
    try {
      const res = await api.get(`/workspaces/${workspaceId}/announcements`)
      set({ announcements: res.data.announcements, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createAnnouncement: async (content) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const user = useAuthStore.getState().user
    
    // Create optimistic announcement
    const optimisticAnnouncement = {
      id: `temp-${Date.now()}`,
      content,
      isPinned: false,
      createdAt: new Date().toISOString(),
      author: { id: user?.id, name: user?.name, avatar: user?.avatar },
      comments: [],
      reactions: []
    }
    
    // Add optimistically first (sorted by pinned)
    set(state => {
      const newList = [optimisticAnnouncement, ...state.announcements].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      return { announcements: newList }
    })
    
    try {
      const res = await api.post(`/workspaces/${workspaceId}/announcements`, { content })
      
      // Replace optimistic with real one
      set(state => ({
        announcements: state.announcements.map(a => 
          a.id === optimisticAnnouncement.id ? res.data.announcement : a
        )
      }))
      
      return res.data.announcement
    } catch (err) {
      // Revert on failure
      set(state => ({
        announcements: state.announcements.filter(a => a.id !== optimisticAnnouncement.id)
      }))
      throw err
    }
  },

  togglePin: async (id) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    await api.patch(`/workspaces/${workspaceId}/announcements/${id}/pin`)
  },

  // optimistic reaction toggle
  toggleReaction: async (announcementId, emoji, userId) => {
    const previous = get().announcements
    set(state => ({
      announcements: state.announcements.map(a => {
        if (a.id !== announcementId) return a
        const exists = a.reactions.find(r => r.userId === userId && r.emoji === emoji)
        return {
          ...a,
          reactions: exists
            ? a.reactions.filter(r => !(r.userId === userId && r.emoji === emoji))
            : [...a.reactions, { emoji, userId, announcementId }]
        }
      })
    }))
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    try {
      await api.post(`/workspaces/${workspaceId}/announcements/${announcementId}/reactions`, { emoji })
    } catch {
      set({ announcements: previous })
    }
  },

  addComment: async (announcementId, content) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspace?.id
    const user = useAuthStore.getState().user
    
    // Create optimistic comment
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      author: { id: user?.id, name: user?.name, avatar: user?.avatar }
    }
    
    // Add optimistically first
    set(state => ({
      announcements: state.announcements.map(a => {
        if (a.id !== announcementId) return a
        return {
          ...a,
          comments: [optimisticComment, ...(a.comments || [])]
        }
      })
    }))
    
    try {
      const res = await api.post(
        `/workspaces/${workspaceId}/announcements/${announcementId}/comments`,
        { content }
      )
      // Replace optimistic comment with real one
      set(state => ({
        announcements: state.announcements.map(a => {
          if (a.id !== announcementId) return a
          return {
            ...a,
            comments: a.comments.map(c => 
              c.id === optimisticComment.id ? res.data.comment : c
            )
          }
        })
      }))
      return res.data.comment
    } catch (err) {
      // Revert on failure
      set(state => ({
        announcements: state.announcements.map(a => {
          if (a.id !== announcementId) return a
          return {
            ...a,
            comments: a.comments.filter(c => c.id !== optimisticComment.id)
          }
        })
      }))
      throw err
    }
  },

  // socket event handlers
  handleNewAnnouncement: (announcement) => {
    // Skip temp announcements (optimistic ones handled by createAnnouncement)
    if (announcement.id?.startsWith('temp-')) return
    
    set(state => {
      // Skip if already exists by ID
      const exists = state.announcements.find(a => a.id === announcement.id)
      if (exists) return state
      
      // Skip if same content from same author was added recently (within 5 seconds) - prevents optimistic duplicates
      const recentFromSameAuthor = state.announcements.some(a => 
        a.author?.id === announcement.author?.id && 
        a.content === announcement.content &&
        a.id?.startsWith('temp-')
      )
      if (recentFromSameAuthor) return state
      
      // Add new announcement and sort by pinned (pinned first) then by createdAt
      const newList = [announcement, ...state.announcements].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      
      return { announcements: newList }
    })
  },

  handleReactionUpdate: ({ announcementId, emoji, userId, removed }) => {
    set(state => ({
      announcements: state.announcements.map(a => {
        if (a.id !== announcementId) return a
        return {
          ...a,
          reactions: removed
            ? a.reactions.filter(r => !(r.userId === userId && r.emoji === emoji))
            : [...a.reactions.filter(r => !(r.userId === userId && r.emoji === emoji)),
            { emoji, userId, announcementId }]
        }
      })
    }))
  },

  handleNewComment: ({ announcementId, comment }) => {
    // Skip if it's a temp comment (optimistic comment) - already handled by addComment
    if (comment.id?.startsWith('temp-')) return
    
    set(state => {
      const announcement = state.announcements.find(a => a.id === announcementId)
      if (!announcement) return state
      
      // Skip if comment already exists (by ID)
      const existsById = announcement.comments.some(c => c.id === comment.id)
      if (existsById) return state
      
      // Skip if same content from same author was added recently (within 3 seconds) - prevents optimistic duplicates
      const recentFromSameAuthor = announcement.comments.some(c => 
        c.author?.id === comment.author?.id && 
        c.content === comment.content &&
        c.id?.startsWith('temp-')
      )
      if (recentFromSameAuthor) return state
      
      return {
        announcements: state.announcements.map(a => 
          a.id === announcementId 
            ? { ...a, comments: [...a.comments, comment] }
            : a
        )
      }
    })
  },

  handlePinUpdate: ({ id, isPinned }) => {
    set(state => ({
      announcements: state.announcements
        .map(a => a.id === id ? { ...a, isPinned } : a)
        .sort((a, b) => b.isPinned - a.isPinned)
    }))
  },

  setOnlineUsers: (onlineUserIds) => set({ onlineUserIds })
}))

export default useAnnouncementStore
