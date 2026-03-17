import { create } from "zustand";
import { notificationService } from "@/services/notification.service";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (role) => {
    set({ loading: true, error: null });
    try {
      const response = await notificationService.getNotifications(role);
      if (response.success) {
        const items = response.data.items || [];
        const unread = items.filter((n) => !n.isRead).length;
        set({
          notifications: items,
          unreadCount: unread,
          loading: false,
        });
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  markAsRead: async (role, notificationId) => {
    try {
      const response = await notificationService.markAsRead(role, notificationId);
      if (response.success) {
        const { notifications, unreadCount } = get();
        const updated = notifications.map((n) =>
          String(n.notificationId).toLowerCase() === String(notificationId).toLowerCase()
            ? { ...n, isRead: true }
            : n,
        );
        const newUnread = updated.filter((n) => !n.isRead).length;
        set({
          notifications: updated,
          unreadCount: newUnread,
        });
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err.message);
    }
  },

  markAllAsRead: async (role) => {
    try {
      const response = await notificationService.markAllAsRead(role);
      if (response.success) {
        const { notifications } = get();
        const updated = notifications.map((n) => ({ ...n, isRead: true }));
        set({
          notifications: updated,
          unreadCount: 0,
        });
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err.message);
    }
  },

  addNotification: (notification) => {
    const { notifications, unreadCount } = get();
    set({
      notifications: [notification, ...notifications],
      unreadCount: unreadCount + 1,
    });
  },
}));
