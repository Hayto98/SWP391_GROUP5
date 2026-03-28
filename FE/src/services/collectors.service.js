import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * GET /api/v1/enterprise/employees
 * Lấy danh sách toàn bộ employees (API trả về full list, FE phân trang client-side)
 */
export async function getEmployees() {
  return request("/api/v1/enterprise/employees", {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

/**
 * GET /api/v1/enterprise/employees/:employeeId
 * Lấy chi tiết 1 employee
 * @param {string} employeeId - UUID of employee
 */
export async function getEmployeeById(employeeId) {
  return request(`/api/v1/enterprise/employees/${employeeId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

/**
 * POST /api/v1/enterprise/employees
 * Tạo employee mới
 * @param {{ fullname: string, email: string, phone: string, password: string }} payload
 */
export async function createEmployee(payload) {
  return request("/api/v1/enterprise/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    data: payload,
  });
}

/**
 * DELETE /api/v1/enterprise/employees/:employeeId
 * Xóa employee
 * @param {string} employeeId - UUID of employee
 */
export async function deleteEmployee(employeeId) {
  return request(`/api/v1/enterprise/employees/${employeeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

/**
 * GET /api/v1/enterprise/employees/statistics
 * Lấy thống kê nhân sự
 * Response: { total, active, inactive }
 */
export async function getEmployeeStatistics() {
  return request("/api/v1/enterprise/employees/statistics", {
    method: "GET",
    headers: getAuthHeaders(),
  });
}