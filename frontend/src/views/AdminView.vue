<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { api } from "../api";
import type { Dimension, User } from "../types";

const month = ref(new Date().toISOString().slice(0, 7));
const users = ref<User[]>([]);
const dimensions = ref<Dimension[]>([]);
const managerScopes = ref<any[]>([]);
const message = ref("");

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
  items: [] as Array<{ dimensionId: number; score: number }>
});

const managers = computed(() => users.value.filter((u) => u.role === "manager"));
const employees = computed(() => users.value.filter((u) => u.role === "employee"));

async function loadUsers() {
  const { data } = await api.get<User[]>("/users");
  users.value = data;
  if (!assignForm.managerId && managers.value[0]) assignForm.managerId = managers.value[0].id;
  if (!scoreForm.employeeId && employees.value[0]) scoreForm.employeeId = employees.value[0].id;
}

async function loadDimensions() {
  const { data } = await api.get<Dimension[]>("/dimensions");
  dimensions.value = data;
  scoreForm.items = data.map((d) => ({ dimensionId: d.id, score: 80 }));
}

async function loadScopes() {
  const { data } = await api.get("/manager-scopes");
  managerScopes.value = data;
}

async function init() {
  await Promise.all([loadUsers(), loadDimensions(), loadScopes()]);
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
  await api.post("/evaluations", {
    employeeId: scoreForm.employeeId,
    month: month.value,
    remark: scoreForm.remark,
    items: scoreForm.items
  });
  message.value = "评分已提交";
}

onMounted(init);
</script>

<template>
  <div class="page-shell">
    <AppHeader />
    <p v-if="message" class="ok-msg">{{ message }}</p>

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
          <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }}</option>
        </select>
      </div>
      <div class="grid-3" style="margin-top: 12px">
        <label v-for="item in scoreForm.items" :key="item.dimensionId">
          <div>{{ dimensions.find((d) => d.id === item.dimensionId)?.name }}</div>
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

.preview {
  background: var(--surface-muted);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px;
  font-size: 12px;
  overflow-x: auto;
}

.ok-msg {
  margin: 0 0 10px;
  color: var(--ok);
}
</style>
