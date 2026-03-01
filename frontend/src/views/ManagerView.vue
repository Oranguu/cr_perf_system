<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { api } from "../api";

const month = ref(new Date().toISOString().slice(0, 7));
const scopeRows = ref<any[]>([]);
const dimensions = ref<any[]>([]);
const myReport = ref<any>(null);
const message = ref("");
const isErrorMessage = computed(() => Boolean(message.value) && !message.value.includes("成功"));

const scoreForm = reactive({
  employeeId: 0,
  remark: "",
  items: [] as Array<{ dimensionId: number; score: number; comment: string }>
});

async function loadData(notifyError = true) {
  try {
    const [scopeRes, dimRes, myRes] = await Promise.all([
      api.get("/manager-scopes/my"),
      api.get("/dimensions"),
      api.get("/reports/me", { params: { month: month.value } })
    ]);
    scopeRows.value = scopeRes.data;
    dimensions.value = dimRes.data;
    myReport.value = myRes.data;
    scoreForm.items = dimensions.value.map((d: any) => ({ dimensionId: d.id, score: 3, comment: "" }));
    if (scopeRows.value[0]) {
      scoreForm.employeeId = scopeRows.value[0].employeeId;
    }
    return true;
  } catch (error: any) {
    message.value = error?.response?.data?.message ?? "加载数据失败";
    if (notifyError) {
      window.alert(message.value);
    }
    return false;
  }
}

async function onRefreshMyPerf() {
  const ok = await loadData(false);
  window.alert(ok ? "我的绩效已刷新" : message.value || "刷新失败，请重试");
}

async function submitScore() {
  message.value = "";
  if (!scoreForm.employeeId) {
    message.value = "请先选择员工";
    window.alert(message.value);
    return;
  }

  try {
    await api.post("/evaluations", {
      employeeId: scoreForm.employeeId,
      month: month.value,
      remark: scoreForm.remark,
      items: scoreForm.items
    });
    message.value = "评分提交成功";
    window.alert(message.value);
    await loadData(false);
  } catch (error: any) {
    message.value = error?.response?.data?.message ?? "提交失败，请检查输入后重试";
    window.alert(message.value);
  }
}

onMounted(() => {
  void loadData();
});

const myCurrentMonthScore = computed(() => {
  const rows = myReport.value?.monthly ?? [];
  return rows.find((row: any) => row.month === month.value)?.totalScore ?? "-";
});
</script>

<template>
  <div class="page-shell">
    <AppHeader />
    <section class="panel block">
      <h2 class="panel-title">我的绩效（主管同时也是员工）</h2>
      <div class="cards">
        <article class="card panel">
          <h3>当前月度分数</h3>
          <p class="big">{{ myCurrentMonthScore }}</p>
          <p class="sub">月份：{{ month }}</p>
        </article>
        <article class="card panel">
          <h3>我的月度排名</h3>
          <p class="big">{{ myReport?.ranking?.monthly?.myRank ?? "-" }} / {{ myReport?.ranking?.monthly?.totalCount ?? "-" }}</p>
          <p class="sub">分数：{{ myReport?.ranking?.monthly?.myScore ?? "-" }}</p>
        </article>
        <article class="card panel">
          <h3>我的半年度排名</h3>
          <p class="big">{{ myReport?.ranking?.halfYear?.myRank ?? "-" }} / {{ myReport?.ranking?.halfYear?.totalCount ?? "-" }}</p>
          <p class="sub">分数：{{ myReport?.ranking?.halfYear?.myScore ?? "-" }}</p>
        </article>
      </div>
      <div class="top-actions">
        <input v-model="month" class="input month" type="month" />
        <button class="btn btn-primary" @click="onRefreshMyPerf">刷新我的绩效</button>
      </div>
    </section>

    <section class="panel block">
      <h2 class="panel-title">我的授权员工</h2>
      <table class="table">
        <thead>
          <tr>
            <th>头像</th>
            <th>员工</th>
            <th>工号</th>
            <th>岗位</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in scopeRows" :key="row.id">
            <td><img class="avatar-cell" :src="row.employee.avatarUrl ? `http://localhost:4000${row.employee.avatarUrl}` : 'https://placehold.co/40x40?text=U'" alt="avatar" /></td>
            <td>{{ row.employee.fullName }}</td>
            <td>{{ row.employee.employee?.employeeNo }}</td>
            <td>{{ row.employee.employee?.title }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="panel block">
      <h2 class="panel-title">月度评分录入</h2>
      <p v-if="message" :class="isErrorMessage ? 'err-msg' : 'ok-msg'">{{ message }}</p>
      <div class="grid-2">
        <input v-model="month" class="input" type="month" />
        <select v-model.number="scoreForm.employeeId" class="select">
          <option v-for="row in scopeRows" :key="row.employeeId" :value="row.employeeId">
            {{ row.employee.fullName }}
          </option>
        </select>
      </div>
      <div class="dimension-list" style="margin-top: 12px">
        <article class="dimension-card" v-for="item in scoreForm.items" :key="item.dimensionId">
          <h3 class="dimension-name">
            {{ dimensions.find((d: any) => d.id === item.dimensionId)?.name }}
            <span class="weight-tag">
              权重 {{ Math.round((dimensions.find((d: any) => d.id === item.dimensionId)?.weight ?? 0) * 100) }}%
            </span>
          </h3>
          <div class="guide">
            <div><strong>5分：</strong>{{ dimensions.find((d: any) => d.id === item.dimensionId)?.score5Desc }}</div>
            <div><strong>4分：</strong>{{ dimensions.find((d: any) => d.id === item.dimensionId)?.score4Desc }}</div>
            <div><strong>3分：</strong>{{ dimensions.find((d: any) => d.id === item.dimensionId)?.score3Desc }}</div>
            <div><strong>2分：</strong>{{ dimensions.find((d: any) => d.id === item.dimensionId)?.score2Desc }}</div>
            <div><strong>1分：</strong>{{ dimensions.find((d: any) => d.id === item.dimensionId)?.score1Desc }}</div>
          </div>
          <select v-model.number="item.score" class="select" style="margin-top: 8px">
            <option :value="5">5 分</option>
            <option :value="4">4 分</option>
            <option :value="3">3 分</option>
            <option :value="2">2 分</option>
            <option :value="1">1 分</option>
          </select>
          <textarea
            v-model="item.comment"
            class="textarea"
            placeholder="可选：填写该维度的评价依据"
            style="margin-top: 8px"
          />
        </article>
      </div>
      <textarea v-model="scoreForm.remark" class="textarea" placeholder="评语（可选）" style="margin: 12px 0" />
      <button class="btn btn-primary" @click="submitScore">提交评分</button>
    </section>
  </div>
</template>

<style scoped>
.block {
  margin-bottom: 16px;
  padding: 16px;
}

.top-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.month {
  max-width: 200px;
}

.grid-2,
.grid-3 {
  display: grid;
  gap: 10px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dimension-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dimension-card {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px;
  background: var(--surface-muted);
}

.dimension-name {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
}

.weight-tag {
  font-size: 12px;
  color: var(--text-soft);
}

.guide {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-soft);
  display: grid;
  gap: 2px;
}

.avatar-cell {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--line);
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

.ok-msg {
  color: var(--ok);
}

.err-msg {
  color: #b53030;
}
</style>
