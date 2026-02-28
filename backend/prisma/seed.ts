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
    { name: "专业能力", description: "业务技能与质量", weight: 0.2, sortOrder: 1 },
    { name: "工作效率", description: "按时交付与响应速度", weight: 0.15, sortOrder: 2 },
    { name: "团队协作", description: "沟通协同与支持他人", weight: 0.15, sortOrder: 3 },
    { name: "责任心", description: "任务闭环与主动性", weight: 0.15, sortOrder: 4 },
    { name: "创新改进", description: "优化思路与创新实践", weight: 0.1, sortOrder: 5 },
    { name: "执行规范", description: "流程规范与文档质量", weight: 0.1, sortOrder: 6 },
    { name: "综合贡献", description: "对团队目标贡献度", weight: 0.15, sortOrder: 7 }
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
