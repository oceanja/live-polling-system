import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api`;

export const api = axios.create({ baseURL: API_BASE });

// Attach the JWT to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surface a clean message from API errors.
export function apiError(err: any, fallback = "Something went wrong"): string {
  return err?.response?.data?.message || fallback;
}
