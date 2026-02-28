import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getUsers(params = {}) {
  const { page = 1, limit = 20, keyword = "", role = "" } = params;
  const queryParams = { page, limit };
  if (keyword) queryParams.keyword = keyword;
  if (role) queryParams.role = role;
  return request("/api/v1/admin/users", {
    method: "GET",
    params: queryParams,
    headers: getAuthHeaders(),
  });
}

export function updateUser(userId, data) {
  return request(`/api/v1/admin/users/${userId}`, {
    method: "PUT",
    data,
    headers: getAuthHeaders(),
  });
}

export function createUser(data) {
  return request("/api/v1/admin/users", {
    method: "POST",
    data,
    headers: getAuthHeaders(),
  });
}

export function getUserById(userId) {
  return request(`/api/v1/admin/users/${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}
