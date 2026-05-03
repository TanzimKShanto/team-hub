'use client'
import { useEffect } from 'react'
import useAuthStore from '@/store/authStore'
import useWorkspaceStore from '@/store/workspaceStore'
import useAnnouncementStore from '@/store/announcementStore'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import useNotificationStore from '@/store/notificationStore'

export default function AuthProvider({ children }) {
  const hydrate = useAuthStore(s => s.hydrate)
  const hydrated = useAuthStore(s => s.hydrated)
  const user = useAuthStore(s => s.user)
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace)
  const { addNotification, fetchNotifications } = useNotificationStore()
  const {
    handleNewAnnouncement,
    handleReactionUpdate,
    handleNewComment,
    handlePinUpdate,
    setOnlineUsers
  } = useAnnouncementStore()

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [])

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user?.id])

  useEffect(() => {
    if (!user || !activeWorkspace) return

    const socket = connectSocket(activeWorkspace.id, user.id)

    socket.on('announcement:new', handleNewAnnouncement)
    socket.on('reaction:update', handleReactionUpdate)
    socket.on('comment:new', handleNewComment)
    socket.on('announcement:pin', handlePinUpdate)
    socket.on('presence:update', ({ onlineUserIds }) => setOnlineUsers(onlineUserIds))
    socket.on('notification:new', (notification) => {
      addNotification(notification)
    })

    return () => {
      socket.off('announcement:new', handleNewAnnouncement)
      socket.off('reaction:update', handleReactionUpdate)
      socket.off('comment:new', handleNewComment)
      socket.off('announcement:pin', handlePinUpdate)
      socket.off('notification:new')
      socket.off('presence:update')
    }
  }, [user?.id, activeWorkspace?.id])

  return children
}
