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
      { dimensionId: 1, score: 4, comment: "稳定交付" },
      { dimensionId: 2, score: 5, comment: "效率很高" },
      { dimensionId: 3, score: 3, comment: "协作一般" }
    ]);

    expect(result.totalScore).toBe(3.8);
    expect(result.itemRows).toHaveLength(3);
  });
});
