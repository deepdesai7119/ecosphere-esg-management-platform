import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatuses,
  assertTransition,
} from "@/lib/esg/challengeLifecycle";

describe("challenge lifecycle", () => {
  it("allows the forward path DRAFT→ACTIVE→UNDER_REVIEW→COMPLETED", () => {
    expect(canTransition("DRAFT", "ACTIVE")).toBe(true);
    expect(canTransition("ACTIVE", "UNDER_REVIEW")).toBe(true);
    expect(canTransition("UNDER_REVIEW", "COMPLETED")).toBe(true);
  });

  it("allows ARCHIVED from any non-archived state", () => {
    expect(canTransition("DRAFT", "ARCHIVED")).toBe(true);
    expect(canTransition("ACTIVE", "ARCHIVED")).toBe(true);
    expect(canTransition("COMPLETED", "ARCHIVED")).toBe(true);
  });

  it("rejects invalid jumps", () => {
    expect(canTransition("DRAFT", "COMPLETED")).toBe(false);
    expect(canTransition("DRAFT", "UNDER_REVIEW")).toBe(false);
    expect(canTransition("COMPLETED", "ACTIVE")).toBe(false);
    expect(canTransition("ARCHIVED", "ACTIVE")).toBe(false);
  });

  it("rejects no-op transitions", () => {
    expect(canTransition("ACTIVE", "ACTIVE")).toBe(false);
  });

  it("lists valid next statuses", () => {
    expect(nextStatuses("DRAFT")).toContain("ACTIVE");
    expect(nextStatuses("ARCHIVED")).toEqual([]);
  });

  it("assertTransition throws on invalid transition", () => {
    expect(() => assertTransition("DRAFT", "COMPLETED")).toThrow();
    expect(() => assertTransition("DRAFT", "ACTIVE")).not.toThrow();
  });
});
