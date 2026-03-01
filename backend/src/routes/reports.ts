import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildEmployeeHalfYearRanking, buildEmployeeMonthlyRanking } from "../services/ranking.js";
import { isMonthText } from "../utils.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const month = String(req.query.month ?? "");
  if (!isMonthText(month)) {
    res.status(400).json({ message: "month 必须是 YYYY-MM 格式" });
    return;
  }

  const employeeId = req.user!.id;
  const monthly = await prisma.evaluation.findMany({
    where: { employeeId },
    include: {
      items: {
        include: { dimension: true },
        orderBy: { dimension: { sortOrder: "asc" } }
      }
    },
    orderBy: { month: "asc" }
  });

  const monthlyRank = await buildEmployeeMonthlyRanking(prisma, month, employeeId);
  const halfYearRank = await buildEmployeeHalfYearRanking(prisma, month, employeeId);

  res.json({
    monthly,
    ranking: {
      monthly: monthlyRank,
      halfYear: halfYearRank
    }
  });
});

router.get("/department", requireAuth, requireRole(Role.admin, Role.manager), async (req, res) => {
  const month = String(req.query.month ?? "");
  if (!isMonthText(month)) {
    res.status(400).json({ message: "month 必须是 YYYY-MM 格式" });
    return;
  }

  const where =
    req.user!.role === Role.manager
      ? {
          month,
          employeeId: {
            in: (
              await prisma.managerScope.findMany({
                where: { managerId: req.user!.id },
                select: { employeeId: true }
              })
            ).map((item) => item.employeeId)
          }
        }
      : { month };

  const list = await prisma.evaluation.findMany({
    where,
    include: {
      employee: { select: { id: true, fullName: true } },
      reviewer: { select: { id: true, fullName: true } },
      items: {
        include: { dimension: true },
        orderBy: { dimension: { sortOrder: "asc" } }
      }
    },
    orderBy: [{ totalScore: "desc" }, { employeeId: "asc" }]
  });

  const avgScore =
    list.length === 0 ? 0 : Number((list.reduce((sum, item) => sum + item.totalScore, 0) / list.length).toFixed(2));
  const highest = list[0]?.totalScore ?? 0;
  const lowest = list[list.length - 1]?.totalScore ?? 0;

  res.json({
    summary: {
      month,
      count: list.length,
      avgScore,
      highest,
      lowest
    },
    list
  });
});

export default router;
