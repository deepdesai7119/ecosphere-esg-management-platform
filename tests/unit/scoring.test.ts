import { describe, it, expect } from "vitest";
import {
  clamp,
  rate,
  goalProgress,
  reductionScore,
  overduePerformance,
  complianceScore,
  environmentalScore,
  socialScore,
  governanceScore,
  overallScore,
  validateWeights,
  scoreGrade,
} from "@/lib/esg/scoring";

describe("clamp", () => {
  it("keeps values within 0–100 by default", () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-20)).toBe(0);
    expect(clamp(42)).toBe(42);
  });
  it("handles NaN/Infinity defensively by returning the minimum", () => {
    expect(clamp(NaN)).toBe(0);
    expect(clamp(Infinity)).toBe(0);
  });
});

describe("rate", () => {
  it("computes a percentage and guards divide-by-zero", () => {
    expect(rate(1, 4)).toBe(25);
    expect(rate(5, 0)).toBe(0);
    expect(rate(10, 5)).toBe(100); // clamped
  });
});

describe("goalProgress", () => {
  it("works for reduction goals (target < baseline)", () => {
    // baseline 620, target 500, current 560 → 50% of the way
    expect(goalProgress(560, 620, 500)).toBeCloseTo(50, 0);
  });
  it("works for increase goals (target > baseline)", () => {
    expect(goalProgress(50, 30, 70)).toBeCloseTo(50, 0);
  });
  it("clamps beyond target", () => {
    expect(goalProgress(500, 620, 500)).toBe(100);
    expect(goalProgress(650, 620, 500)).toBe(0);
  });
});

describe("reductionScore", () => {
  it("maps no change to 50 and a 50% cut to 100", () => {
    expect(reductionScore(100, 100)).toBe(50);
    expect(reductionScore(100, 50)).toBe(100);
    expect(reductionScore(100, 150)).toBe(0);
  });
  it("is neutral with no baseline", () => {
    expect(reductionScore(0, 100)).toBe(50);
  });
});

describe("overduePerformance & complianceScore", () => {
  it("rewards fewer overdue issues", () => {
    expect(overduePerformance(10, 0)).toBe(100);
    expect(overduePerformance(10, 5)).toBe(50);
    expect(overduePerformance(0, 0)).toBe(100);
  });
  it("combines resolution and overdue performance", () => {
    expect(complianceScore({ totalIssues: 0, resolvedIssues: 0, overdueIssues: 0 })).toBe(100);
    const s = complianceScore({ totalIssues: 10, resolvedIssues: 5, overdueIssues: 2 });
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("pillar scores use documented weights", () => {
  it("environmental = 50/30/20", () => {
    const r = environmentalScore({ goalProgress: 100, emissionReduction: 0, dataCompleteness: 0 });
    expect(r.score).toBe(50);
    expect(r.components).toHaveLength(3);
  });
  it("social = 40/30/30", () => {
    const r = socialScore({ csrParticipation: 100, trainingCompletion: 0, engagementDiversity: 0 });
    expect(r.score).toBe(40);
  });
  it("governance = 35/35/30", () => {
    const r = governanceScore({ policyAcknowledgement: 100, auditPerformance: 0, complianceResolution: 0 });
    expect(r.score).toBe(35);
  });
  it("all pillar scores stay within 0–100", () => {
    const r = environmentalScore({ goalProgress: 999, emissionReduction: 999, dataCompleteness: 999 });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
});

describe("overallScore (weighted)", () => {
  it("applies percentage weights", () => {
    const total = overallScore(
      { environmental: 80, social: 70, governance: 90 },
      { environmental: 40, social: 30, governance: 30 },
    );
    // 80*.4 + 70*.3 + 90*.3 = 32 + 21 + 27 = 80
    expect(total).toBe(80);
  });
  it("clamps result to 0–100", () => {
    const total = overallScore(
      { environmental: 100, social: 100, governance: 100 },
      { environmental: 40, social: 30, governance: 30 },
    );
    expect(total).toBe(100);
  });
});

describe("validateWeights", () => {
  it("requires the three weights to sum to exactly 100", () => {
    expect(validateWeights({ environmental: 40, social: 30, governance: 30 })).toEqual({ valid: true, total: 100 });
    expect(validateWeights({ environmental: 40, social: 40, governance: 30 })).toEqual({ valid: false, total: 110 });
    expect(validateWeights({ environmental: 50, social: 30, governance: 10 }).valid).toBe(false);
  });
});

describe("scoreGrade", () => {
  it("maps scores to letter grades", () => {
    expect(scoreGrade(95)).toBe("A+");
    expect(scoreGrade(82)).toBe("A");
    expect(scoreGrade(72)).toBe("B");
    expect(scoreGrade(40)).toBe("E");
  });
});
