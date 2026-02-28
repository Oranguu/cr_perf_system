<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

function onLogout() {
  auth.logout();
  router.push("/login");
}
</script>

<template>
  <header class="header panel">
    <div>
      <div class="title">部门绩效评分系统</div>
      <div class="subtitle">当前用户：{{ auth.user?.fullName }}（{{ auth.user?.role }}）</div>
    </div>
    <button class="btn" @click="onLogout">退出登录</button>
  </header>
</template>

<style scoped>
.header {
  margin-bottom: 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 20px;
  font-weight: 700;
}

.subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-soft);
}
</style>
