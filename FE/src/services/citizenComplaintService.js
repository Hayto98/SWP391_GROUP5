import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function createReportComplaint(payload) {
  return request("/citizen/report-complaints", {
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });
}

export function getReportComplaints(params = {}) {
  return request("/citizen/report-complaints", {
    method: "GET",
    params,
    headers: getAuthHeaders(),
  });
}

export function getReportComplaintDetail(complaintId) {
  return request(`/citizen/report-complaints/${complaintId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}
