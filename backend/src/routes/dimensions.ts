import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const saveDimensionSchema = z.array(
  z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    description: z.string().min(1),
    weight: z.number().positive(),
    sortOrder: z.number().int(),
    isActive: z.boolean().default(true),
    score5Desc: z.string().min(1),
    score4Desc: z.string().min(1),
    score3Desc: z.string().min(1),
    score2Desc: z.string().min(1),
    score1Desc: z.string().min(1)
  })
);

router.get("/", requireAuth, async (_req, res) => {
  const dimensions = await prisma.dimension.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  });
  res.json(dimensions);
});

router.put("/", requireAuth, requireRole(Role.admin), async (req, res) => {
  const parsed = saveDimensionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "参数错误" });
    return;
  }

  const totalWeight = parsed.data.reduce((sum, item) => sum + item.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.001) {
    res.status(400).json({ message: "7个维度权重之和必须为1" });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.dimension.deleteMany();
    await tx.dimension.createMany({
      data: parsed.data.map((item) => ({
        name: item.name,
        description: item.description,
        weight: item.weight,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        score5Desc: item.score5Desc,
        score4Desc: item.score4Desc,
        score3Desc: item.score3Desc,
        score2Desc: item.score2Desc,
        score1Desc: item.score1Desc
      }))
    });
    return tx.dimension.findMany({ orderBy: { sortOrder: "asc" } });
  });

  res.json(result);
});

export default router;
