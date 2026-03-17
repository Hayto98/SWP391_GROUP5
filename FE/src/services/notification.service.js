import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const getRolePrefix = (role) => {
  if (typeof role === "number") {
    switch (role) {
      case 1:
        return "api/v1/admin";
      case 2:
        return "enterprise";
      case 3:
        return "api/v1/collector";
      case 4:
        return "citizen";
      default:
        return "citizen";
    }
  }

  const r = String(role).toLowerCase();
  if (r === "admin") return "api/v1/admin";
  if (r === "enterprise") return "enterprise";
  if (r === "collector") return "api/v1/collector";
  return "citizen";
};

export const notificationService = {
  /**
   * Fetch paginated notifications for the current role
   */
  getNotifications: async (role, params = { page: 1, limit: 20 }) => {
    const prefix = getRolePrefix(role);
    return request(`/${prefix}/notifications`, {
      params,
      headers: getAuthHeaders(),
    });
  },

  /**
   * Mark a single notification as read
   */
  /**
   * Mark a single notification as read
   */
  markAsRead: async (role, notificationId) => {
    const prefix = getRolePrefix(role);
    return request(`/${prefix}/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
  },

  /**
   * Mark all notifications as read for current role
   */
  markAllAsRead: async (role) => {
    const prefix = getRolePrefix(role);
    return request(`/${prefix}/notifications/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
  },
};
