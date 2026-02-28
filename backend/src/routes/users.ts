import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3),
  fullName: z.string().min(1),
  role: z.enum(["admin", "manager", "employee"]),
  password: z.string().min(6),
  employeeNo: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  joinDate: z.string().optional()
});

router.get("/", requireAuth, requireRole(Role.admin), async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      employee: true
    }
  });
  res.json(users);
});

router.post("/", requireAuth, requireRole(Role.admin), async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "参数错误" });
    return;
  }
  const data = parsed.data;

  const exists = await prisma.user.findUnique({ where: { username: data.username } });
  if (exists) {
    res.status(409).json({ message: "用户名已存在" });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      fullName: data.fullName,
      role: data.role as Role,
      passwordHash,
      employee:
        data.role === "employee"
          ? {
              create: {
                employeeNo: data.employeeNo ?? `AUTO${Date.now()}`,
                department: data.department ?? "未分配部门",
                title: data.title ?? "员工",
                joinDate: data.joinDate ? new Date(data.joinDate) : new Date()
              }
            }
          : undefined
    },
    select: { id: true, username: true, fullName: true, role: true, employee: true }
  });

  res.status(201).json(user);
});

export default router;
