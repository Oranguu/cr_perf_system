import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.evaluationItem.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.managerScope.deleteMany();
  await prisma.dimension.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash,
      fullName: "系统管理员",
      role: Role.admin
    }
  });

  const manager = await prisma.user.create({
    data: {
      username: "manager1",
      passwordHash,
      fullName: "主管张三",
      role: Role.manager
    }
  });

  const employeeA = await prisma.user.create({
    data: {
      username: "employee1",
      passwordHash,
      fullName: "员工李四",
      role: Role.employee,
      employee: {
        create: {
          employeeNo: "A001",
          department: "美术组",
          title: "美术设计师",
          joinDate: new Date("2024-03-01")
        }
      }
    }
  });

  const employeeB = await prisma.user.create({
    data: {
      username: "employee2",
      passwordHash,
      fullName: "员工王五",
      role: Role.employee,
      employee: {
        create: {
          employeeNo: "A002",
          department: "美术组",
          title: "场景设计师",
          joinDate: new Date("2024-06-01")
        }
      }
    }
  });

  const dimensions = [
    {
      name: "产出价值贡献",
      description: "你的工作成果，是否真实地给“产品”或“团队”带来了正向收益？",
      weight: 0.25,
      sortOrder: 1,
      score5Desc: "对关键目标（里程碑目标 / 商业化营收 / 生产成本与效率）产生明显价值贡献。",
      score4Desc: "在任务中体现出超出任务要求的主动性价值贡献。",
      score3Desc: "负责产出能支撑项目正常推进，人天产出充分。",
      score2Desc: "贡献有限，人天产出不满，当月产出低于团队预期。",
      score1Desc: "对整体目标帮助甚微或产生负面影响。"
    },
    {
      name: "创新度",
      description: "你是否努力在“把事情越做越漂亮”，而不只是越做越多？",
      weight: 0.2,
      sortOrder: 2,
      score5Desc: "提出并成功落地创新方案（工具/流程/方法/产品创意推送），形成复用价值。",
      score4Desc: "有在工作中进行明确创新动作，能解决实际问题，并产生正向效果。",
      score3Desc: "能在既有框架下做出合理优化。",
      score2Desc: "想法较少，被动执行工作。",
      score1Desc: "拒绝变化，对新方案持消极态度。"
    },
    {
      name: "专业性",
      description: "产出内容，能否体现对应职级的专业度？",
      weight: 0.2,
      sortOrder: 3,
      score5Desc: "专业能力明显超出岗位预期：产出成为团队参考标准，返工极低，能主动优化规格、流程或工具，降低他人成本。",
      score4Desc: "在质量/效率/稳定性上有明显亮点，在关键节点把复杂问题一次做对。",
      score3Desc: "按岗位要求稳定完成工作，质量、效率、返工率符合预期。",
      score2Desc: "专业表现不稳定，需要反复修改或提醒，偶尔影响上下游。",
      score1Desc: "专业能力明显不足，多次影响交付、质量或节奏。"
    },
    {
      name: "积极主动",
      description: "事情来了，是“等分配”，还是“往前站一步”？",
      weight: 0.1,
      sortOrder: 4,
      score5Desc: "在无人明确要求时，主动承担关键责任，多次兜底、补位，让项目更稳。",
      score4Desc: "面对问题不回避，主动推动协作或解决方案，而不是只反馈问题。",
      score3Desc: "能按要求主动完成职责内工作，不拖延、不推诿。",
      score2Desc: "需要提醒或推动后才行动，主动性不足。",
      score1Desc: "等指令、被动执行，甚至出现推责行为。"
    },
    {
      name: "协作",
      description: "别人和你一起工作，是“更顺”，还是“更难”？",
      weight: 0.1,
      sortOrder: 5,
      score5Desc: "主动协调多角色 / 多环节冲突，让团队协作效率明显提升。",
      score4Desc: "沟通顺畅，能理解他人诉求，关键时刻帮助他人解困。",
      score3Desc: "与上下游配合顺畅，沟通基本清晰。",
      score2Desc: "沟通成本较高，偶尔因表达或配合问题影响效率。",
      score1Desc: "协作中频繁制造摩擦或信息不透明。"
    },
    {
      name: "领导力/影响力",
      description: "即使不是管理者，能否对他人产生正向影响？",
      weight: 0.1,
      sortOrder: 6,
      score5Desc: "能自然影响他人决策与行动，带动小范围形成“自动运转”。",
      score4Desc: "在项目或专项中承担“事实上的负责人”角色。",
      score3Desc: "能在自己范围内做好决策与执行。",
      score2Desc: "影响力有限，更多只顾自己。",
      score1Desc: "对团队产生负面影响或信任问题。"
    },
    {
      name: "价值观",
      description: "你是否真心认可我们正在做的事情，并愿意与团队、时代变化一起，持续精进自己，持续向前走？",
      weight: 0.05,
      sortOrder: 7,
      score5Desc: "高度认可游戏产品、团队目标与AI时代发展方向，并通过实际行为正向影响与带动他人。",
      score4Desc: "明确认同游戏与团队发展方向，积极跟进变化，行为始终与团队目标保持一致。",
      score3Desc: "行为表现满足团队价值观要求，认可目标，配合节奏，不拖慢团队进步。",
      score2Desc: "对团队方向或变化存在明显消极情绪，虽能配合但在行为上拉扯节奏。",
      score1Desc: "明显不认同游戏或团队发展方向，抵触变化，并对团队产生负向影响。"
    }
  ];

  await prisma.dimension.createMany({ data: dimensions });

  await prisma.managerScope.createMany({
    data: [
      { managerId: manager.id, employeeId: employeeA.id },
      { managerId: manager.id, employeeId: employeeB.id }
    ]
  });

  console.log("Seed completed.");
  console.log({
    admin: { username: admin.username, password: "123456" },
    manager: { username: manager.username, password: "123456" },
    employee1: { username: employeeA.username, password: "123456" },
    employee2: { username: employeeB.username, password: "123456" }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
