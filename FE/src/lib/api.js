import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

async function request(path, options = {}) {
  const { method = "GET", headers, params, data, body, ...rest } = options;

  try {
    const response = await apiClient({
      url: path,
      method,
      headers,
      params,
      data: data !== undefined ? data : body,
      ...rest,
    });

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message || error.message || "Request failed";
    const apiError = new Error(message);
    apiError.status = error?.response?.status;
    apiError.details = error?.response?.data?.details;
    throw apiError;
  }
}

export function registerUser(payload) {
  return request("/api/auth/register", {
    method: "POST",
    data: payload,
  });
}

export function loginUser(payload) {
  return request("/api/auth/login", {
    method: "POST",
    data: payload,
  });
}
