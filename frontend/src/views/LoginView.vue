<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref("");
const form = reactive({
  username: "",
  password: ""
});

async function onSubmit() {
  errorMessage.value = "";
  loading.value = true;
  try {
    await auth.login(form.username, form.password);
    if (auth.role === "admin") router.push("/admin");
    else if (auth.role === "manager") router.push("/manager");
    else router.push("/employee");
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? "登录失败，请重试";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card panel">
      <h1>部门绩效评分系统</h1>
      <p class="desc">本地MVP版 · 月度评分、半年度汇总、个人排名</p>
      <form @submit.prevent="onSubmit">
        <label class="field">
          <span>用户名</span>
          <input v-model="form.username" class="input" placeholder="例如：admin" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="form.password" class="input" type="password" placeholder="请输入密码" />
        </label>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <button class="btn btn-primary full-btn" :disabled="loading">
          {{ loading ? "登录中..." : "登录" }}
        </button>
      </form>
      <div class="demo-tip">
        演示账号：admin / manager1 / employee1（密码均为 123456）
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 28px;
}

h1 {
  margin: 0;
  font-size: 30px;
}

.desc {
  margin: 10px 0 20px;
  color: var(--text-soft);
  font-size: 14px;
}

.field {
  display: block;
  margin-bottom: 14px;
}

.field span {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 14px;
}

.error {
  color: #b53030;
  font-size: 13px;
}

.full-btn {
  width: 100%;
  margin-top: 8px;
}

.demo-tip {
  margin-top: 14px;
  padding: 10px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: var(--surface-muted);
  font-size: 12px;
  color: var(--text-soft);
}
</style>
