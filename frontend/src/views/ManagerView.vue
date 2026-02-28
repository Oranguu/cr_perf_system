<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { api } from "../api";

const month = ref(new Date().toISOString().slice(0, 7));
const scopeRows = ref<any[]>([]);
const dimensions = ref<any[]>([]);
const message = ref("");

const scoreForm = reactive({
  employeeId: 0,
  remark: "",
  items: [] as Array<{ dimensionId: number; score: number }>
});

async function loadData() {
  const [scopeRes, dimRes] = await Promise.all([api.get("/manager-scopes/my"), api.get("/dimensions")]);
  scopeRows.value = scopeRes.data;
  dimensions.value = dimRes.data;
  scoreForm.items = dimensions.value.map((d: any) => ({ dimensionId: d.id, score: 80 }));
  if (scopeRows.value[0]) {
    scoreForm.employeeId = scopeRows.value[0].employeeId;
  }
}

async function submitScore() {
  message.value = "";
  await api.post("/evaluations", {
    employeeId: scoreForm.employeeId,
    month: month.value,
    remark: scoreForm.remark,
    items: scoreForm.items
  });
  message.value = "评分提交成功";
}

onMounted(loadData);
</script>

<template>
  <div class="page-shell">
    <AppHeader />
    <section class="panel block">
      <h2 class="panel-title">我的授权员工</h2>
      <table class="table">
        <thead>
          <tr>
            <th>员工</th>
            <th>工号</th>
            <th>岗位</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in scopeRows" :key="row.id">
            <td>{{ row.employee.fullName }}</td>
            <td>{{ row.employee.employee?.employeeNo }}</td>
            <td>{{ row.employee.employee?.title }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="panel block">
      <h2 class="panel-title">月度评分录入</h2>
      <p v-if="message" class="ok-msg">{{ message }}</p>
      <div class="grid-2">
        <input v-model="month" class="input" type="month" />
        <select v-model.number="scoreForm.employeeId" class="select">
          <option v-for="row in scopeRows" :key="row.employeeId" :value="row.employeeId">
            {{ row.employee.fullName }}
          </option>
        </select>
      </div>
      <div class="grid-3" style="margin-top: 12px">
        <label v-for="item in scoreForm.items" :key="item.dimensionId">
          <div>{{ dimensions.find((d: any) => d.id === item.dimensionId)?.name }}</div>
          <input v-model.number="item.score" class="input" type="number" min="0" max="100" />
        </label>
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

.ok-msg {
  color: var(--ok);
}
</style>
