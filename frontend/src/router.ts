import { createRouter, createWebHistory } from "vue-router";
import LoginView from "./views/LoginView.vue";
import AdminView from "./views/AdminView.vue";
import ManagerView from "./views/ManagerView.vue";
import EmployeeView from "./views/EmployeeView.vue";
import { useAuthStore } from "./stores/auth";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: LoginView },
    { path: "/admin", name: "admin", component: AdminView },
    { path: "/manager", name: "manager", component: ManagerView },
    { path: "/employee", name: "employee", component: EmployeeView },
    { path: "/", redirect: "/login" }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.path === "/login") {
    if (!auth.isLoggedIn) return true;
    if (auth.role === "admin") return "/admin";
    if (auth.role === "manager") return "/manager";
    return "/employee";
  }

  if (!auth.isLoggedIn) return "/login";

  if (to.path.startsWith("/admin") && auth.role !== "admin") return "/login";
  if (to.path.startsWith("/manager") && auth.role !== "manager") return "/login";
  if (to.path.startsWith("/employee") && auth.role !== "employee") return "/login";

  return true;
});
