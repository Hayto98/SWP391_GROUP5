import { request } from "./apiClient";

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

export function verifyOtpUser(payload) {
  return request("/api/auth/verify-otp", {
    method: "POST",
    data: payload,
  });
}
