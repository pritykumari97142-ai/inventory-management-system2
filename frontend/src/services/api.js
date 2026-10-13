import axios from "axios";

// Determine the base API URL:
// 1. If VITE_API_URL is explicitly set, use it.
// 2. If running locally in a browser on localhost / 127.0.0.1, use http://localhost:5000/api.
// 3. Otherwise, fallback to the deployed production backend.
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000/api";
  }
  return "https://inventory-management-system2-2.onrender.com/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
