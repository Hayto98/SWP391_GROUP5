import { request } from "./apiClient";

const BASE = "/api/v1/admin/report-complaints";

export function getComplaints(params = {}) {
  const query = {};
  if (params.status && params.status !== "ALL") query.status = params.status;
  if (params.fromDate) query.fromDate = params.fromDate;
  if (params.toDate) query.toDate = params.toDate;
  if (params.citizenId) query.citizenId = params.citizenId;
  if (params.page) query.page = params.page;
  if (params.size) query.size = params.size;

  return request(BASE, { method: "GET", params: query });
}

export function getComplaintDetail(complaintId) {
  return request(`${BASE}/${complaintId}`, { method: "GET" });
}

export function resolveComplaint(complaintId, { adminResponse, refundPoints }) {
  return request(`${BASE}/${complaintId}/resolve`, {
    method: "PUT",
    data: { adminResponse, refundPoints },
  });
}

export function rejectComplaint(complaintId, { adminResponse }) {
  return request(`${BASE}/${complaintId}/reject`, {
    method: "PUT",
    data: { adminResponse },
  });
}
