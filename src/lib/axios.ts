import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export const API_BASE_URL =
  import.meta.env?.VITE_API_URL ??
  '/api/v1';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Send HttpOnly cookies automatically (same-origin via Vite proxy)
  withCredentials: true,
});

// Request Interceptor — no manual token injection needed; cookies are sent automatically
// If impersonating a school, attach the X-Tenant-ID header to scope requests
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const savedImpersonation = localStorage.getItem("super_admin_impersonation");
      if (savedImpersonation) {
        try {
          const session = JSON.parse(savedImpersonation);
          if (session && session.schoolId) {
            config.headers['X-Tenant-ID'] = session.schoolId;
          }
        } catch (_) {}
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Dispatch event so React context can react (e.g. show re-login UI)
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
