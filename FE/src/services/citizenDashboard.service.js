import { request } from "./apiClient";

export function getCitizenDashboardStatistics() {
  return request("/citizen/dashboard/statistics");
}

