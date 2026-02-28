import { describe, expect, it } from "vitest";
import { calculateWeightedScore } from "../src/services/scoring.js";

describe("calculateWeightedScore", () => {
  it("should calculate total weighted score", () => {
    const dimensions = [
      { id: 1, weight: 0.2 },
      { id: 2, weight: 0.3 },
      { id: 3, weight: 0.5 }
    ] as any;

    const result = calculateWeightedScore(dimensions, [
      { dimensionId: 1, score: 80 },
      { dimensionId: 2, score: 90 },
      { dimensionId: 3, score: 70 }
    ]);

    expect(result.totalScore).toBe(78);
    expect(result.itemRows).toHaveLength(3);
  });
});
