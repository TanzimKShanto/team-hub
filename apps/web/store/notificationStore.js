import { create } from 'zustand'
import api from '@/lib/api'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications')
      const notifications = res.data.notifications
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length
      })
    } catch { }
  },

  addNotification: (notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      read: false
    }
    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all')
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }))
    } catch { }
  }
}))

export default useNotificationStore
