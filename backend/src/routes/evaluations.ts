import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { calculateWeightedScore } from "../services/scoring.js";
import { isMonthText } from "../utils.js";

const router = Router();

const upsertSchema = z.object({
  employeeId: z.number().int().positive(),
  month: z.string(),
  remark: z.string().optional(),
  items: z.array(
    z.object({
      dimensionId: z.number().int().positive(),
      score: z.number().min(1).max(5),
      comment: z.string().min(1, "请填写该维度评价")
    })
  )
});

router.get("/", requireAuth, async (req, res) => {
  const month = String(req.query.month ?? "");
  if (!isMonthText(month)) {
    res.status(400).json({ message: "month 必须是 YYYY-MM 格式" });
    return;
  }

  const managerScopeIds =
    req.user!.role === Role.manager
      ? (
          await prisma.managerScope.findMany({
            where: { managerId: req.user!.id },
            select: { employeeId: true }
          })
        ).map((s) => s.employeeId)
      : [];

  const where =
    req.user!.role === Role.employee
      ? { month, employeeId: req.user!.id }
      : req.user!.role === Role.manager
        ? {
            month,
            employeeId: {
              // 主管具备员工能力：可看自己的绩效，也可看其授权范围内员工。
              in: [...new Set([...managerScopeIds, req.user!.id])]
            }
          }
        : { month };

  const rows = await prisma.evaluation.findMany({
    where,
    include: {
      employee: { select: { id: true, fullName: true } },
      reviewer: { select: { id: true, fullName: true } },
      items: {
        include: { dimension: true },
        orderBy: { dimension: { sortOrder: "asc" } }
      }
    },
    orderBy: { totalScore: "desc" }
  });

  res.json(rows);
});

router.post("/", requireAuth, requireRole(Role.admin, Role.manager), async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "参数错误" });
    return;
  }
  const data = parsed.data;
  if (!isMonthText(data.month)) {
    res.status(400).json({ message: "month 必须是 YYYY-MM 格式" });
    return;
  }

  if (req.user!.role === Role.manager) {
    const scope = await prisma.managerScope.findUnique({
      where: {
        managerId_employeeId: {
          managerId: req.user!.id,
          employeeId: data.employeeId
        }
      }
    });
    if (!scope) {
      res.status(403).json({ message: "你没有权限给这个员工打分" });
      return;
    }
  }

  const dimensions = await prisma.dimension.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  });
  if (data.items.length !== dimensions.length) {
    res.status(400).json({ message: "评分项数量必须与维度数量一致" });
    return;
  }

  const scoreResult = calculateWeightedScore(dimensions, data.items);

  const evaluation = await prisma.$transaction(async (tx) => {
    const row = await tx.evaluation.upsert({
      where: {
        employeeId_month: {
          employeeId: data.employeeId,
          month: data.month
        }
      },
      update: {
        reviewerId: req.user!.id,
        totalScore: scoreResult.totalScore,
        remark: data.remark
      },
      create: {
        employeeId: data.employeeId,
        reviewerId: req.user!.id,
        month: data.month,
        totalScore: scoreResult.totalScore,
        remark: data.remark
      }
    });

    await tx.evaluationItem.deleteMany({ where: { evaluationId: row.id } });
    await tx.evaluationItem.createMany({
      data: scoreResult.itemRows.map((item) => ({
        evaluationId: row.id,
        dimensionId: item.dimensionId,
        score: item.score,
        weightedScore: item.weightedScore,
        comment: item.comment
      }))
    });

    return tx.evaluation.findUnique({
      where: { id: row.id },
      include: {
        employee: { select: { id: true, fullName: true } },
        reviewer: { select: { id: true, fullName: true } },
        items: { include: { dimension: true } }
      }
    });
  });

  res.json(evaluation);
});

export default router;
