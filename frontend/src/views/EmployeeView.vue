<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { api } from "../api";
import { useAuthStore } from "../stores/auth";

const month = ref(new Date().toISOString().slice(0, 7));
const report = ref<any>(null);
const loading = ref(false);
const avatarFile = ref<File | null>(null);
const auth = useAuthStore();

const latest = computed(() => {
  if (!report.value?.monthly?.length) return null;
  return [...report.value.monthly].sort((a: any, b: any) => b.month.localeCompare(a.month))[0];
});

const currentMonthDetail = computed(() => {
  const rows = report.value?.monthly ?? [];
  return rows.find((row: any) => row.month === month.value) ?? null;
});

async function loadReport() {
  loading.value = true;
  try {
    const { data } = await api.get("/reports/me", {
      params: { month: month.value }
    });
    report.value = data;
    return true;
  } catch {
    return false;
  } finally {
    loading.value = false;
  }
}

async function onRefresh() {
  const ok = await loadReport();
  window.alert(ok ? "已刷新绩效数据" : "刷新失败");
}

function onAvatarChange(event: Event) {
  avatarFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

async function uploadMyAvatar() {
  if (!auth.user?.id) {
    window.alert("用户信息丢失，请重新登录");
    return;
  }
  if (!avatarFile.value) {
    window.alert("请先选择头像文件");
    return;
  }
  const formData = new FormData();
  formData.append("avatar", avatarFile.value);
  try {
    await api.post(`/users/${auth.user.id}/avatar`, formData);
    await auth.refreshMe();
    window.alert("头像上传成功");
  } catch (error: any) {
    window.alert(error?.response?.data?.message ?? "头像上传失败");
  }
}

onMounted(loadReport);
</script>

<template>
  <div class="page-shell">
    <AppHeader />
    <section class="panel block">
      <h2 class="panel-title">我的头像</h2>
      <div class="actions">
        <input class="input" type="file" accept="image/*" @change="onAvatarChange" />
        <button class="btn btn-primary" @click="uploadMyAvatar">上传头像</button>
      </div>
    </section>

    <section class="panel block">
      <h2 class="panel-title">我的绩效总览</h2>
      <div class="actions">
        <input v-model="month" class="input month" type="month" />
        <button class="btn btn-primary" @click="onRefresh">刷新</button>
      </div>
      <p v-if="loading">加载中...</p>
      <div v-else class="cards">
        <article class="card panel">
          <h3>当前月度排名</h3>
          <p class="big">{{ report?.ranking?.monthly?.myRank ?? "-" }} / {{ report?.ranking?.monthly?.totalCount ?? "-" }}</p>
          <p class="sub">分数：{{ report?.ranking?.monthly?.myScore ?? "-" }}</p>
        </article>
        <article class="card panel">
          <h3>半年度排名</h3>
          <p class="big">{{ report?.ranking?.halfYear?.myRank ?? "-" }} / {{ report?.ranking?.halfYear?.totalCount ?? "-" }}</p>
          <p class="sub">分数：{{ report?.ranking?.halfYear?.myScore ?? "-" }}</p>
        </article>
        <article class="card panel">
          <h3>最近月度成绩</h3>
          <p class="big">{{ latest?.totalScore ?? "-" }}</p>
          <p class="sub">月份：{{ latest?.month ?? "-" }}</p>
        </article>
      </div>
    </section>

    <section class="panel block">
      <h2 class="panel-title">我的月度明细</h2>
      <table class="table">
        <thead>
          <tr>
            <th>月份</th>
            <th>总分</th>
            <th>评语</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in report?.monthly ?? []" :key="row.id">
            <td>{{ row.month }}</td>
            <td>{{ row.totalScore }}</td>
            <td>{{ row.remark || "-" }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="panel block">
      <h2 class="panel-title">当前月份维度明细（含评分依据）</h2>
      <table class="table">
        <thead>
          <tr>
            <th>维度</th>
            <th>分数（1~5）</th>
            <th>加权分</th>
            <th>评价依据</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in currentMonthDetail?.items ?? []" :key="item.id">
            <td>{{ item.dimension.name }}</td>
            <td>{{ item.score }}</td>
            <td>{{ item.weightedScore }}</td>
            <td>{{ item.comment }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!currentMonthDetail" class="sub" style="margin-top: 10px">该月份暂无维度评分明细。</p>
    </section>
  </div>
</template>

<style scoped>
.block {
  margin-bottom: 16px;
  padding: 16px;
}

.actions {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.month {
  max-width: 200px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.card {
  padding: 14px;
}

.card h3 {
  margin: 0;
  font-size: 14px;
  color: var(--text-soft);
}

.big {
  margin: 10px 0 4px;
  font-size: 28px;
  font-weight: 700;
}

.sub {
  margin: 0;
  color: var(--text-soft);
}
</style>
