import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCollectorReports(params = {}) {
  return request("/api/v1/collector/reports", {
    method: "GET",
    params,
    headers: getAuthHeaders(),
  });
}

export function getCollectorReportById(reportId) {
  return request(`/api/v1/collector/reports/${reportId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export function acceptCollectorReport(reportId) {
  return request(`/api/v1/collector/reports/${reportId}/accept`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
}

export function scheduleCollectorReport(reportId, scheduledCollectAt) {
  return request(`/api/v1/collector/reports/${reportId}/schedule`, {
    method: "PATCH",
    data: {
      scheduledCollectAt,
    },
    headers: getAuthHeaders(),
  });
}

export function submitCollectorReportResult(reportId, payload) {
  const formData = new FormData();
  formData.append("actualQuantity", String(payload.actualQuantity));
  formData.append("quantityUnit", payload.quantityUnit || "KG");
  formData.append("quantity_unit", payload.quantityUnit || "KG");
  formData.append("note", payload.note || "");

  if (payload.file) {
    formData.append("file", payload.file);
  }

  return request(`/api/v1/collector/reports/${reportId}/complete`, {
    method: "POST",
    data: formData,
    headers: getAuthHeaders(),
  });
}
