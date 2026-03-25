import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCollectorDashboardStatistics(params = {}) {
  return request("/api/v1/collector/dashboard/statistics", {
    method: "GET",
    params,
    headers: getAuthHeaders(),
  });
}
