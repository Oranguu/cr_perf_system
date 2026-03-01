# 部门绩效评分系统（本地 MVP）

这是一个面向“部门绩效打分”的本地可运行系统，适合你先在本机验证流程，再迁移到公司服务器。

本项目已实现：
- 管理员（admin）维护维度、员工、主管授权，并可录入评分。
- 主管（manager）是“更高级员工”：既能查看自己的绩效，也能给被授权员工打分。
- 员工（employee）只看自己的月度/半年度绩效与个人排名，不看他人明细。

---

## 1. 技术栈说明（为什么这样选）

- 前端：`Vue 3 + Vite + TypeScript + Pinia + Vue Router`
  - 学习资料多、生态成熟、开发体验好。
- 后端：`Node.js + Express + TypeScript`
  - 结构直观，容易理解和二次开发。
- 数据库：`SQLite + Prisma`
  - 本地无需安装数据库服务，开箱可用，成本最低。
  - 后续迁移 PostgreSQL 时，只需调整 Prisma 配置和迁移。

---

## 2. 项目目录（按职责分层）

```text
cr_perf_system/
├─ frontend/                  # Vue 前端
│  ├─ src/
│  │  ├─ components/          # 可复用组件
│  │  ├─ stores/              # Pinia 状态管理
│  │  ├─ views/               # 页面（登录/管理员/主管/员工）
│  │  ├─ api.ts               # Axios 实例与请求拦截器
│  │  ├─ router.ts            # 路由与角色守卫
│  │  └─ style.css            # 全局样式（浅色极简）
│  └─ ...
├─ backend/                   # Node 后端
│  ├─ prisma/
│  │  ├─ schema.prisma        # 数据模型定义
│  │  └─ seed.ts              # 种子数据（演示账号）
│  ├─ src/
│  │  ├─ middleware/          # 认证与角色校验
│  │  ├─ routes/              # 各业务路由
│  │  ├─ services/            # 评分计算、排名等核心逻辑
│  │  ├─ app.ts               # Express 应用
│  │  └─ server.ts            # 启动入口
│  ├─ tests/                  # 单元测试
│  └─ .env.example            # 环境变量示例
├─ ref/                       # 你的参考资料（Excel等）
└─ README.md
```

---

## 3. 功能清单（当前 MVP）

### 3.1 登录与权限

- JWT 登录认证。
- 三角色递进：
  - `admin`：全管理权限。
  - `manager`：拥有员工能力 + 主管能力（可看自己绩效、可评分授权员工）。
  - `employee`：只能看自己的绩效与排名。

### 3.2 评分模型

- 每月 7 个维度评分（每项 1~5 分）。
- 每个维度有权重（总和必须等于 1）。
- 月度总分 = 每维度 `score * weight` 后求和。
- 半年度分 = H1/H2 区间内月度分平均值。
- 每个维度都要求填写“评价依据”，员工可在个人页面查看评分原因。

### 3.3 排名隐私策略

- 员工端只返回：
  - `myRank`
  - `totalCount`
  - `myScore`
  - `myPercentile`
- 不返回他人分数列表，避免泄露同事绩效明细。

---

## 4. 快速启动（新手版）

### 4.1 环境准备

- Node.js 18+（建议 20+）
- npm 9+

### 4.2 安装依赖

在项目根目录执行：

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 4.3 初始化数据库（首次必做）

```bash
npm run db:setup --prefix backend
```

该命令会自动执行：
1. Prisma Client 生成
2. SQLite 建表
3. 写入演示账号与默认 7 维度

### 4.4 启动前后端（推荐）

```bash
npm run dev
```

- 前端地址：`http://localhost:5173`
- 后端地址：`http://localhost:4000`

---

## 5. 演示账号（种子数据）

默认密码均为：`123456`

- 管理员：admin：`admin`
- 主管：`manager1`
- 员工：`employee1`
- 员工：`employee2`

---

## 6. 页面使用说明

### 6.1 管理员页面（/admin）

1. **账号管理**：创建员工/主管账号。  
2. **维度权重管理**：维护 7 维度名称、说明、权重。  
3. **主管授权管理**：选择主管后，勾选可评分员工。  
4. **评分录入**：按月份给员工打分（1~5 分）并填写每个维度的评价依据。  
5. **全员绩效总览**：查看当月所有人的绩效，并可一键加载后修改。  

### 6.2 主管页面（/manager）

1. 查看“我的绩效”（月度分、月度排名、半年度排名）。
2. 查看“我的授权员工”。
3. 选择月份和员工，填写 7 维度评分（1~5 分）及维度评价后提交。

### 6.3 员工页面（/employee）

1. 查看当前月度排名。
2. 查看半年度排名。
3. 查看自己的月度成绩列表与最新成绩。

---

## 7. 后端核心接口（简表）

### 认证
- `POST /auth/login`
- `GET /auth/me`

### 用户与权限
- `GET /users`（admin）
- `POST /users`（admin）
- `GET /manager-scopes`（admin）
- `PUT /manager-scopes`（admin）
- `GET /manager-scopes/my`（manager）

### 评分与维度
- `GET /dimensions`（登录后可读）
- `PUT /dimensions`（admin）
- `GET /evaluations?month=YYYY-MM`
- `POST /evaluations`（admin/manager）

### 报表
- `GET /reports/me?month=YYYY-MM`（个人月度+半年度+排名）
- `GET /reports/department?month=YYYY-MM`（admin/manager）

---

## 8. 数据库模型（关键表）

- `User`：账号、角色、状态
- `EmployeeProfile`：员工扩展信息
- `Dimension`：评分维度与权重
- `Evaluation`：月度评分主表
- `EvaluationItem`：维度评分明细
- `ManagerScope`：主管可评分员工映射

---

## 9. 常见问题（FAQ）

### Q1：为什么员工看不到同事排名明细？
这是权限设计要求，系统只返回“本人排名”而不是全员列表，避免绩效信息外泄。

### Q2：为什么要求权重和必须等于 1？
这样计算才标准，月度总分才可解释、可比。

### Q3：可以录入过去月份吗？
可以。`month` 只要是 `YYYY-MM` 即可，支持补录历史月份。

### Q4：如果需要导入历史 Excel 怎么办？
本 MVP 暂未做导入。后续可增加“Excel 导入接口”，读取后写入 `Evaluation` 和 `EvaluationItem`。

---

## 10. 测试与构建

### 后端测试

```bash
npm run test --prefix backend
```

### 后端构建

```bash
npm run build --prefix backend
```

### 前端构建

```bash
npm run build --prefix frontend
```

---

## 11. 从本地迁移到公司服务器（路线）

### 第一步：数据库迁移
- 测试环境可继续用 SQLite。
- 正式环境建议 PostgreSQL（并发更好，备份更规范）。

### 第二步：后端部署
- 服务器安装 Node.js。
- 配置 `backend/.env`（尤其 `JWT_SECRET`）。
- 运行 `npm run db:setup --prefix backend`。
- 使用 PM2 或系统服务托管 `npm run start --prefix backend`。

### 第三步：前端部署
- 执行 `npm run build --prefix frontend`。
- 将 `frontend/dist` 部署到 Nginx 静态目录。
- 反向代理 `/api` 到 Node 后端。

### 第四步：域名与 HTTPS
- 绑定公司域名。
- 配置 HTTPS（公司证书或 Let’s Encrypt）。

---

## 12. 下一阶段建议（你后面可以让我继续做）

1. Excel 历史数据导入（你现有模板自动解析）。
2. 审批流（主管评分后需管理员确认）。
3. 评分日志与操作审计（谁在何时改了什么）。
4. 图表报表（趋势折线、维度雷达、部门分布）。
5. 批量导出（个人绩效单/部门月报）。

---

如果你愿意，我下一步可以直接做“**历史 Excel 导入模块**”，把你 `ref` 里的模板映射成系统数据结构，并加上导入预览和错误提示。
