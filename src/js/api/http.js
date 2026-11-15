// Base HTTP client (axios) for the local json-server.
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export const http = axios.create({
  baseURL: API_URL,
  timeout: 4000,
  headers: { "Content-Type": "application/json" },
});

// Optional demo of failures: add ?fail=1 to the page URL and every write request fails.
// Used to show the optimistic UI rollback.
const failWrites = new URLSearchParams(window.location.search).has("fail");

http.interceptors.request.use((config) => {
  if (failWrites && config.method !== "get") {
    return Promise.reject(Object.assign(new Error("Simulated server error (?fail=1)"), { simulated: true }));
  }
  return config;
});
