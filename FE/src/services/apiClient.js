import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

export async function request(path, options = {}) {
  const { method = "GET", headers, params, data, body, ...rest } = options;
  const requestData = data !== undefined ? data : body;
  const requestHeaders = { ...(headers || {}) };

  if (requestData instanceof FormData) {
    // Let the browser set the correct multipart boundary automatically.
    requestHeaders.Accept = requestHeaders.Accept || "application/json";
    requestHeaders["Content-Type"] = undefined;
    delete requestHeaders["Content-Type"];
    delete requestHeaders["content-type"];
  }

  try {
    const response = await apiClient({
      url: path,
      method,
      headers: requestHeaders,
      params,
      data: requestData,
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

export default apiClient;
