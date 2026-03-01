import { Dimension } from "@prisma/client";

export type ScoreInput = {
  dimensionId: number;
  score: number;
  comment: string;
};

export type ScoreResult = {
  totalScore: number;
  itemRows: Array<{
    dimensionId: number;
    score: number;
    weightedScore: number;
    comment: string;
  }>;
};

export function calculateWeightedScore(dimensions: Dimension[], items: ScoreInput[]): ScoreResult {
  const dimensionMap = new Map(dimensions.map((d) => [d.id, d]));

  let totalScore = 0;
  const itemRows = items.map((item) => {
    const dimension = dimensionMap.get(item.dimensionId);
    if (!dimension) {
      throw new Error(`维度不存在: ${item.dimensionId}`);
    }

    // 约定单项分为 1~5，维度权重为 0~1。
    const weightedScore = Number((item.score * dimension.weight).toFixed(2));
    totalScore += weightedScore;

    return {
      dimensionId: item.dimensionId,
      score: item.score,
      weightedScore,
      comment: item.comment
    };
  });

  return {
    totalScore: Number(totalScore.toFixed(2)),
    itemRows
  };
}
