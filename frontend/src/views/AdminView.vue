<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { api } from "../api";
import type { Dimension, User } from "../types";

const month = ref(new Date().toISOString().slice(0, 7));
const users = ref<User[]>([]);
const dimensions = ref<Dimension[]>([]);
const managerScopes = ref<any[]>([]);
const departmentReport = ref<any>(null);
const message = ref("");
const isErrorMessage = computed(() => Boolean(message.value) && !message.value.includes("成功") && !message.value.includes("已提交"));

const newUserForm = reactive({
  username: "",
  fullName: "",
  role: "employee",
  password: "123456",
  employeeNo: "",
  department: "美术组",
  title: "员工",
  joinDate: new Date().toISOString().slice(0, 10)
});

const assignForm = reactive({
  managerId: 0,
  employeeIds: [] as number[]
});

const scoreForm = reactive({
  employeeId: 0,
  remark: "",
  items: [] as Array<{ dimensionId: number; score: number; comment: string }>
});

const managers = computed(() => users.value.filter((u) => u.role === "manager"));
const employees = computed(() => users.value.filter((u) => u.role === "employee"));
const rateTargets = computed(() => users.value.filter((u) => u.role !== "admin"));

async function loadUsers() {
  const { data } = await api.get<User[]>("/users");
  users.value = data;
  if (!assignForm.managerId && managers.value[0]) assignForm.managerId = managers.value[0].id;
  if (!scoreForm.employeeId && employees.value[0]) scoreForm.employeeId = employees.value[0].id;
}

async function loadDimensions() {
  const { data } = await api.get<Dimension[]>("/dimensions");
  dimensions.value = data;
  scoreForm.items = data.map((d) => ({ dimensionId: d.id, score: 3, comment: "" }));
}

async function loadScopes() {
  const { data } = await api.get("/manager-scopes");
  managerScopes.value = data;
}

async function init() {
  await Promise.all([loadUsers(), loadDimensions(), loadScopes(), loadDepartmentReport()]);
}

async function createUser() {
  message.value = "";
  await api.post("/users", newUserForm);
  message.value = "账号创建成功";
  await loadUsers();
}

async function saveScopes() {
  message.value = "";
  await api.put("/manager-scopes", assignForm);
  message.value = "主管授权已保存";
  await loadScopes();
}

async function saveDimensions() {
  message.value = "";
  await api.put("/dimensions", dimensions.value);
  message.value = "维度与权重已更新";
}

async function submitScore() {
  message.value = "";
  if (!scoreForm.employeeId) {
    message.value = "请先选择员工";
    return;
  }
  if (scoreForm.items.some((item) => !item.comment.trim())) {
    message.value = "请先填写每个维度的评价依据";
    return;
  }

  try {
    await api.post("/evaluations", {
      employeeId: scoreForm.employeeId,
      month: month.value,
      remark: scoreForm.remark,
      items: scoreForm.items
    });
    message.value = "评分已提交";
    await loadDepartmentReport();
  } catch (error: any) {
    message.value = error?.response?.data?.message ?? "提交失败，请检查输入后重试";
  }
}

async function loadDepartmentReport() {
  const { data } = await api.get("/reports/department", {
    params: { month: month.value }
  });
  departmentReport.value = data;
}

function editFromEvaluation(row: any) {
  scoreForm.employeeId = row.employeeId;
  scoreForm.remark = row.remark ?? "";

  const itemMap = new Map((row.items ?? []).map((item: any) => [item.dimensionId, item.score]));
  scoreForm.items = dimensions.value.map((d) => ({
    dimensionId: d.id,
    score: Number(itemMap.get(d.id) ?? 3),
    comment: row.items?.find((it: any) => it.dimensionId === d.id)?.comment ?? ""
  }));

  message.value = `已载入 ${row.employee.fullName} 在 ${row.month} 的评分，可直接修改后提交`;
}

onMounted(init);
</script>

<template>
  <div class="page-shell">
    <AppHeader />
    <p v-if="message" :class="isErrorMessage ? 'err-msg' : 'ok-msg'">{{ message }}</p>

    <section class="panel block">
      <h2 class="panel-title">1) 账号管理</h2>
      <div class="grid-3">
        <input v-model="newUserForm.username" class="input" placeholder="用户名" />
        <input v-model="newUserForm.fullName" class="input" placeholder="姓名" />
        <select v-model="newUserForm.role" class="select">
          <option value="admin">admin</option>
          <option value="manager">manager</option>
          <option value="employee">employee</option>
        </select>
      </div>
      <div class="grid-4">
        <input v-model="newUserForm.password" class="input" placeholder="密码" />
        <input v-model="newUserForm.employeeNo" class="input" placeholder="工号（员工可填）" />
        <input v-model="newUserForm.department" class="input" placeholder="部门" />
        <input v-model="newUserForm.title" class="input" placeholder="岗位" />
      </div>
      <button class="btn btn-primary" @click="createUser">创建账号</button>
      <table class="table" style="margin-top: 12px">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>姓名</th>
            <th>角色</th>
            <th>工号</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.fullName }}</td>
            <td>{{ u.role }}</td>
            <td>{{ u.employee?.employeeNo ?? "-" }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="panel block">
      <h2 class="panel-title">2) 维度与权重（总和必须=1）</h2>
      <table class="table">
        <thead>
          <tr>
            <th>排序</th>
            <th>维度</th>
            <th>说明</th>
            <th>权重</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in dimensions" :key="d.id">
            <td>{{ d.sortOrder }}</td>
            <td><input v-model="d.name" class="input" /></td>
            <td><input v-model="d.description" class="input" /></td>
            <td><input v-model.number="d.weight" class="input" type="number" min="0" step="0.01" /></td>
          </tr>
        </tbody>
      </table>
      <button class="btn btn-primary" @click="saveDimensions">保存维度配置</button>
    </section>

    <section class="panel block">
      <h2 class="panel-title">3) 主管评分授权</h2>
      <div class="grid-2">
        <select v-model.number="assignForm.managerId" class="select">
          <option v-for="m in managers" :key="m.id" :value="m.id">{{ m.fullName }}</option>
        </select>
        <select v-model.number="assignForm.employeeIds" class="select" multiple>
          <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }}</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="saveScopes">保存授权</button>
      <pre class="preview">{{ managerScopes }}</pre>
    </section>

    <section class="panel block">
      <h2 class="panel-title">4) 月度评分录入</h2>
      <div class="grid-2">
        <input v-model="month" class="input" type="month" />
        <select v-model.number="scoreForm.employeeId" class="select">
          <option v-for="u in rateTargets" :key="u.id" :value="u.id">
            {{ u.fullName }}（{{ u.role }}）
          </option>
        </select>
      </div>
      <div class="dimension-list" style="margin-top: 12px">
        <article class="dimension-card" v-for="item in scoreForm.items" :key="item.dimensionId">
          <h3 class="dimension-name">
            {{ dimensions.find((d) => d.id === item.dimensionId)?.name }}
            <span class="weight-tag">
              权重 {{ Math.round((dimensions.find((d) => d.id === item.dimensionId)?.weight ?? 0) * 100) }}%
            </span>
          </h3>
          <div class="guide">
            <div><strong>5分：</strong>{{ dimensions.find((d) => d.id === item.dimensionId)?.score5Desc }}</div>
            <div><strong>4分：</strong>{{ dimensions.find((d) => d.id === item.dimensionId)?.score4Desc }}</div>
            <div><strong>3分：</strong>{{ dimensions.find((d) => d.id === item.dimensionId)?.score3Desc }}</div>
            <div><strong>2分：</strong>{{ dimensions.find((d) => d.id === item.dimensionId)?.score2Desc }}</div>
            <div><strong>1分：</strong>{{ dimensions.find((d) => d.id === item.dimensionId)?.score1Desc }}</div>
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
            placeholder="请填写该维度的评价依据（必填）"
            style="margin-top: 8px"
          />
        </article>
      </div>
      <textarea v-model="scoreForm.remark" class="textarea" placeholder="评语（可选）" style="margin: 12px 0" />
      <button class="btn btn-primary" @click="submitScore">提交评分</button>
    </section>

    <section class="panel block">
      <h2 class="panel-title">5) 全员绩效总览（管理员）</h2>
      <div class="grid-2">
        <div class="summary">
          <strong>月份：</strong>{{ departmentReport?.summary?.month ?? month }}
          <strong>人数：</strong>{{ departmentReport?.summary?.count ?? 0 }}
          <strong>平均分：</strong>{{ departmentReport?.summary?.avgScore ?? 0 }}
          <strong>最高：</strong>{{ departmentReport?.summary?.highest ?? 0 }}
          <strong>最低：</strong>{{ departmentReport?.summary?.lowest ?? 0 }}
        </div>
        <div style="text-align: right">
          <button class="btn" @click="loadDepartmentReport">刷新总览</button>
        </div>
      </div>

      <table class="table" style="margin-top: 8px">
        <thead>
          <tr>
            <th>员工</th>
            <th>总分</th>
            <th>评分人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in departmentReport?.list ?? []" :key="row.id">
            <td>{{ row.employee.fullName }}</td>
            <td>{{ row.totalScore }}</td>
            <td>{{ row.reviewer.fullName }}</td>
            <td>
              <button class="btn" @click="editFromEvaluation(row)">加载并编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.block {
  margin-bottom: 16px;
  padding: 16px;
}

.grid-2,
.grid-3,
.grid-4 {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.preview {
  background: var(--surface-muted);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px;
  font-size: 12px;
  overflow-x: auto;
}

.summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--text-soft);
}

.ok-msg {
  margin: 0 0 10px;
  color: var(--ok);
}

.err-msg {
  margin: 0 0 10px;
  color: #b53030;
}
</style>
