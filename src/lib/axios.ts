import { apiClient } from "@/lib/api-client";

export const API_BASE_URL =
  import.meta.env?.VITE_API_URL ??
  '/api/v1';

function withParams(endpoint: string, params?: Record<string, unknown>): string {
  if (!params) return endpoint;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

export const axiosInstance = {
  get: (endpoint: string, config?: { params?: Record<string, unknown> }) =>
    apiClient(withParams(endpoint, config?.params)),
  post: (endpoint: string, data?: unknown) =>
    apiClient(endpoint, { method: "POST", data }),
  put: (endpoint: string, data?: unknown) =>
    apiClient(endpoint, { method: "PUT", data }),
  patch: (endpoint: string, data?: unknown) =>
    apiClient(endpoint, { method: "PATCH", data }),
  delete: (endpoint: string) => apiClient(endpoint, { method: "DELETE" }),
};

export default axiosInstance;
