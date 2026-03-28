import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function createWasteReport(payload) {
  return request("/api/reports", {
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });
}

export async function processAIPredictWaste(file) {
  // try {
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   const data = await request("/api/v1/ai/predict-waste", {
  //     method: "POST",
  //     data: formData,
  //   });
  //   return data;
  // } catch (error) {
  //   throw error;
  // }
}

export function getMyReports(params = {}) {
  return request("/api/reports/my", {
    method: "GET",
    params,
    headers: getAuthHeaders(),
  });
}

export function getReportById(reportId) {
  return request(`/api/reports/${reportId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export function updateReportById(reportId, payload) {
  return request(`/api/reports/${reportId}`, {
    method: "PUT",
    data: payload,
    headers: getAuthHeaders(),
  });
}

export function deleteReportById(reportId) {
  return request(`/api/reports/${reportId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}
