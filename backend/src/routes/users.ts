import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `avatar-${req.params.id || "me"}-${Date.now()}${ext}`);
  }
});
const avatarUpload = multer({ storage });

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
      avatarUrl: true,
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
    select: { id: true, username: true, fullName: true, role: true, avatarUrl: true, employee: true }
  });

  res.status(201).json(user);
});

router.post("/:id/avatar", requireAuth, avatarUpload.single("avatar"), async (req, res) => {
  const targetUserId = Number(req.params.id);
  if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
    res.status(400).json({ message: "无效的用户ID" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: "请先选择头像文件" });
    return;
  }

  const canEdit = req.user!.role === Role.admin || req.user!.id === targetUserId;
  if (!canEdit) {
    res.status(403).json({ message: "你没有权限上传该用户头像" });
    return;
  }

  const avatarUrl = `/uploads/${req.file.filename}`;
  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { avatarUrl },
    select: { id: true, fullName: true, avatarUrl: true }
  });

  res.json({ message: "头像上传成功", user });
});

export default router;
