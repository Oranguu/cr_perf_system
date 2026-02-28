import { PrismaClient } from "@prisma/client";
import { monthToHalfYear } from "../utils.js";

export async function buildEmployeeMonthlyRanking(prisma: PrismaClient, month: string, employeeId: number) {
  const rows = await prisma.evaluation.findMany({
    where: { month },
    orderBy: [{ totalScore: "desc" }, { employeeId: "asc" }]
  });

  const index = rows.findIndex((row) => row.employeeId === employeeId);
  if (index === -1) {
    return null;
  }

  const rank = index + 1;
  return {
    month,
    myScore: rows[index].totalScore,
    myRank: rank,
    totalCount: rows.length,
    myPercentile: Number((((rows.length - rank) / rows.length) * 100).toFixed(2))
  };
}

export async function buildEmployeeHalfYearRanking(prisma: PrismaClient, month: string, employeeId: number) {
  const period = monthToHalfYear(month);
  const [yearText, halfText] = period.split("-H");
  const year = Number(yearText);
  const half = Number(halfText);
  const monthRange = half === 1 ? [1, 6] : [7, 12];

  const rows = await prisma.evaluation.findMany({
    where: {
      month: {
        gte: `${year}-${String(monthRange[0]).padStart(2, "0")}`,
        lte: `${year}-${String(monthRange[1]).padStart(2, "0")}`
      }
    },
    select: { employeeId: true, totalScore: true }
  });

  const grouped = new Map<number, { sum: number; count: number }>();
  for (const row of rows) {
    const current = grouped.get(row.employeeId) ?? { sum: 0, count: 0 };
    current.sum += row.totalScore;
    current.count += 1;
    grouped.set(row.employeeId, current);
  }

  const rankingRows = [...grouped.entries()]
    .map(([id, value]) => ({
      employeeId: id,
      halfYearScore: Number((value.sum / value.count).toFixed(2))
    }))
    .sort((a, b) => (b.halfYearScore !== a.halfYearScore ? b.halfYearScore - a.halfYearScore : a.employeeId - b.employeeId));

  const index = rankingRows.findIndex((row) => row.employeeId === employeeId);
  if (index === -1) {
    return null;
  }

  const rank = index + 1;
  return {
    period,
    myScore: rankingRows[index].halfYearScore,
    myRank: rank,
    totalCount: rankingRows.length,
    myPercentile: Number((((rankingRows.length - rank) / rankingRows.length) * 100).toFixed(2))
  };
}
