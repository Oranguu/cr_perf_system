import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const assignSchema = z.object({
  managerId: z.number().int().positive(),
  employeeIds: z.array(z.number().int().positive())
});

router.get("/", requireAuth, requireRole(Role.admin), async (_req, res) => {
  const scopes = await prisma.managerScope.findMany({
    include: {
      manager: { select: { id: true, fullName: true, username: true } },
      employee: { select: { id: true, fullName: true, username: true } }
    },
    orderBy: { managerId: "asc" }
  });
  res.json(scopes);
});

router.get("/my", requireAuth, requireRole(Role.manager), async (req, res) => {
  const scopes = await prisma.managerScope.findMany({
    where: { managerId: req.user!.id },
    include: {
      employee: { include: { employee: true } }
    },
    orderBy: { employeeId: "asc" }
  });
  res.json(scopes);
});

router.put("/", requireAuth, requireRole(Role.admin), async (req, res) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "参数错误" });
    return;
  }

  const manager = await prisma.user.findUnique({ where: { id: parsed.data.managerId } });
  if (!manager || manager.role !== Role.manager) {
    res.status(400).json({ message: "managerId 必须是主管账号" });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.managerScope.deleteMany({ where: { managerId: parsed.data.managerId } });
    if (parsed.data.employeeIds.length > 0) {
      await tx.managerScope.createMany({
        data: parsed.data.employeeIds.map((employeeId) => ({
          managerId: parsed.data.managerId,
          employeeId
        }))
      });
    }
    return tx.managerScope.findMany({
      where: { managerId: parsed.data.managerId },
      include: {
        employee: { select: { id: true, fullName: true, username: true } }
      }
    });
  });

  res.json(result);
});

export default router;
