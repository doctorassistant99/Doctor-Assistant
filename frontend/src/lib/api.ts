import axios from "axios";

const DEFAULT_API_BASE = "https://doctor-assistant-api-seven.vercel.app/api/v1";

function ensureApiV1(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  const withoutPrefix = trimmed.replace(/\/api\/v1$/, "");
  return `${withoutPrefix}/api/v1`;
}

const api = axios.create({
  baseURL: ensureApiV1(import.meta.env.VITE_API_URL || DEFAULT_API_BASE),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
