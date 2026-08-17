import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  isNotificationPanelOpen: false,

  togglePanel: () => set(state => ({ isNotificationPanelOpen: !state.isNotificationPanelOpen })),
  closePanel: () => set({ isNotificationPanelOpen: false }),

  markAsRead: (id) => set(state => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  markAllAsRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  addNotification: (notif) => set(state => ({
    notifications: [
      {
        id: `NOTIF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...notif
      },
      ...state.notifications
    ]
  }))
}));
