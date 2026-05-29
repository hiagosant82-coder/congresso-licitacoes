import { create } from 'zustand'

export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface NotificationState {
  notifications: Notification[]
  add: (message: string, type?: 'success' | 'error' | 'info') => void
  remove: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  add: (message, type = 'info') => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    set((s) => ({ notifications: [...s.notifications, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
    }, 5000)
  },
  remove: (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
  },
}))
