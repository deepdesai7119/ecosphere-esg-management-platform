import { describe, it, expect } from "vitest";
import { computeCo2eKg, computeOverdue } from "@/lib/esg/calculations";

describe("emission calculation", () => {
  it("co2e = quantity × factor", () => {
    expect(computeCo2eKg(850, 2.68)).toBe(2278);
    expect(computeCo2eKg(1500, 0.82)).toBe(1230);
  });
  it("rounds to two decimals", () => {
    expect(computeCo2eKg(3, 1.855)).toBeCloseTo(5.57, 2);
  });
  it("handles zero", () => {
    expect(computeCo2eKg(0, 2.68)).toBe(0);
  });
});

describe("compliance overdue detection", () => {
  const past = new Date("2020-01-01");
  const future = new Date("2999-01-01");

  it("flags open/in-progress issues past their due date", () => {
    expect(computeOverdue(past, "OPEN")).toBe(true);
    expect(computeOverdue(past, "IN_PROGRESS")).toBe(true);
  });
  it("does not flag resolved/closed issues", () => {
    expect(computeOverdue(past, "RESOLVED")).toBe(false);
    expect(computeOverdue(past, "CLOSED")).toBe(false);
  });
  it("does not flag issues not yet due", () => {
    expect(computeOverdue(future, "OPEN")).toBe(false);
  });
  it("treats missing due date as not overdue", () => {
    expect(computeOverdue(null, "OPEN")).toBe(false);
  });
});
