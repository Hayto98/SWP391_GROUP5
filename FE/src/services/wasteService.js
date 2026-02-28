import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getWasteTypes() {
  const response = await request("/api/waste-types", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (Array.isArray(response?.data)) {
    return response.data.filter((item) => item?.isActive);
  }

  return [];
}

export async function getWasteTypeById(wasteTypeId) {
  return request(`/api/waste-types/${wasteTypeId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}
