<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const uploading = ref(false);

function onLogout() {
  auth.logout();
  window.alert("已退出登录");
  router.push("/login");
}

async function onAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!auth.user?.id) {
    window.alert("用户信息异常，请重新登录");
    return;
  }

  const formData = new FormData();
  formData.append("avatar", file);
  uploading.value = true;
  try {
    await api.post(`/users/${auth.user.id}/avatar`, formData);
    await auth.refreshMe();
    window.alert("头像已更新");
  } catch (error: any) {
    window.alert(error?.response?.data?.message ?? "头像上传失败");
  } finally {
    uploading.value = false;
    (event.target as HTMLInputElement).value = "";
  }
}
</script>

<template>
  <header class="header panel">
    <div class="user-left">
      <label class="avatar-edit" :title="uploading ? '上传中...' : '修改头像'">
        <img class="avatar" :src="auth.user?.avatarUrl ? `http://localhost:4000${auth.user.avatarUrl}` : 'https://placehold.co/64x64?text=U'" alt="avatar" />
        <span class="avatar-mask" v-if="uploading">上传中...</span>
        <span class="avatar-mask avatar-mask-text" v-else>修改<br />头像</span>
        <input class="avatar-input" type="file" accept="image/*" :disabled="uploading" @change="onAvatarChange" />
      </label>
      <div>
      <div class="title">部门绩效评分系统</div>
      <div class="subtitle">当前用户：{{ auth.user?.fullName }}（{{ auth.user?.role }}）</div>
      </div>
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

.user-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid var(--line);
}

.avatar-edit {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.avatar-input {
  display: none;
}

.avatar-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(26, 36, 58, 0.45);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
  text-align: center;
}

.avatar-edit:hover .avatar-mask {
  opacity: 1;
}

.avatar-mask-text {
  line-height: 1.2;
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
