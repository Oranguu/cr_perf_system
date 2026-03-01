import { defineStore } from "pinia";
import { api } from "../api";
import type { LoginResponse } from "../types";

type AuthState = {
  token: string;
  user: LoginResponse["user"] | null;
};

const TOKEN_KEY = "perf_token";
const USER_KEY = "perf_user";

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    user: localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY) ?? "null") : null
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    role: (state) => state.user?.role ?? null
  },
  actions: {
    async login(username: string, password: string) {
      const { data } = await api.post<LoginResponse>("/auth/login", { username, password });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    async refreshMe() {
      const { data } = await api.get("/auth/me");
      if (!this.user) return;
      this.user = {
        ...this.user,
        fullName: data.fullName,
        username: data.username,
        role: data.role,
        avatarUrl: data.avatarUrl
      };
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
    }
  }
});
