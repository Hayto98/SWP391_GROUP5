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

export function rejectCollectorReport(reportId) {
  return request(`/api/v1/collector/reports/${reportId}/reject`, {
    method: "PATCH",
    data: {},
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
  formData.append("actualItems", JSON.stringify(payload.actualItems || []));
  formData.append("quantityUnit", payload.quantityUnit || "KG");
  formData.append("note", payload.note || "");

  if (Array.isArray(payload.files)) {
    payload.files.forEach((file) => {
      if (file) {
        formData.append("files", file);
      }
    });
  } else if (payload.file) {
    formData.append("files", payload.file);
  }

  return request(`/api/v1/collector/reports/${reportId}/complete`, {
    method: "POST",
    data: formData,
    headers: getAuthHeaders(),
  });
}

export function markCollectorReportAsFake(reportId, payload = {}) {
  const hasFiles =
    Array.isArray(payload.files) && payload.files.some((file) => file);

  if (hasFiles || payload.file) {
    const formData = new FormData();
    formData.append("quantityUnit", payload.quantityUnit || "KG");
    formData.append("note", payload.note || "");

    if (hasFiles) {
      payload.files.forEach((file) => {
        if (file) {
          formData.append("files", file);
        }
      });
    } else if (payload.file) {
      formData.append("files", payload.file);
    }

    return request(`/api/v1/collector/reports/${reportId}/mark-fake`, {
      method: "PATCH",
      data: formData,
      headers: getAuthHeaders(),
    });
  }

  return request(`/api/v1/collector/reports/${reportId}/mark-fake`, {
    method: "PATCH",
    data: {
      quantityUnit: payload.quantityUnit || "KG",
      note: payload.note || "",
    },
    headers: getAuthHeaders(),
  });
}
