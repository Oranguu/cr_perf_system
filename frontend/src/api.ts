import axios from "axios";
import { useAuthStore } from "./stores/auth";

export const api = axios.create({
  baseURL: "http://localhost:4000"
});

api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});
