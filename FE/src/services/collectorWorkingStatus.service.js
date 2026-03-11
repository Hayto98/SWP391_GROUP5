import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCollectorWorkingStatus() {
  return request("/api/v1/collector/working-status", {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export function updateCollectorWorkingStatus(isWorking) {
  return request("/api/v1/collector/working-status", {
    method: "PATCH",
    headers: getAuthHeaders(),
    data: { isWorking },
  });
}
