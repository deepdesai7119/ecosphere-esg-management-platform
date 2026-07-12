/**
 * VerdantIQ ESG scoring engine — pure, documented, unit-tested functions.
 *
 * All sub-metrics and returned scores are expressed on a 0–100 scale.
 * The functions here contain NO database access so they can be tested in
 * isolation and reused on both the server and (if needed) the client.
 */

/** Clamp a value into the inclusive [min, max] range. */
export function clamp(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Round to two decimals for stable storage/display. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface ScoreComponent {
  label: string;
  weight: number; // fraction, e.g. 0.5
  value: number; // 0–100
  contribution: number; // weight * value
}

export interface ScoreResult {
  score: number; // 0–100
  components: ScoreComponent[];
}

function combine(components: Omit<ScoreComponent, "contribution">[]): ScoreResult {
  const enriched = components.map((c) => ({
    ...c,
    value: clamp(c.value),
    contribution: round2(c.weight * clamp(c.value)),
  }));
  const score = clamp(enriched.reduce((sum, c) => sum + c.weight * c.value, 0));
  return { score: round2(score), components: enriched };
}

// ------------------------- Derivation helpers -------------------------

/** A simple percentage rate: numerator / denominator, clamped to 0–100. */
export function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return clamp((numerator / denominator) * 100);
}

/**
 * Progress of a metric from a baseline toward a target, as 0–100%.
 * Works for both "reduce" (target < baseline) and "increase" goals because
 * the sign of (target - baseline) cancels with (current - baseline).
 */
export function goalProgress(
  current: number,
  baseline: number,
  target: number,
): number {
  if (target === baseline) return current === target ? 100 : 0;
  const progress = ((current - baseline) / (target - baseline)) * 100;
  return clamp(progress);
}

/**
 * Convert an emission change into a 0–100 "goodness" score.
 * 0% change → 50, a 50% reduction → 100, a 50% increase → 0.
 */
export function reductionScore(previousTotal: number, currentTotal: number): number {
  if (previousTotal <= 0) return 50; // no baseline — neutral
  const reductionPct = ((previousTotal - currentTotal) / previousTotal) * 100;
  return clamp(50 + reductionPct);
}

/** Overdue performance: fewer overdue issues → higher score. */
export function overduePerformance(totalIssues: number, overdueIssues: number): number {
  if (totalIssues <= 0) return 100;
  return clamp(100 - (overdueIssues / totalIssues) * 100);
}

// ------------------------- Pillar scores -------------------------

export interface EnvironmentalInput {
  /** Avg progress of environmental goals (0–100). */
  goalProgress: number;
  /** Emission reduction trend score (0–100), e.g. from {@link reductionScore}. */
  emissionReduction: number;
  /** Share of operations/data captured vs expected (0–100). */
  dataCompleteness: number;
}

/** Environmental score: 50% goal progress · 30% emission trend · 20% data completeness. */
export function environmentalScore(input: EnvironmentalInput): ScoreResult {
  return combine([
    { label: "Goal progress", weight: 0.5, value: input.goalProgress },
    { label: "Emission reduction trend", weight: 0.3, value: input.emissionReduction },
    { label: "Data completeness", weight: 0.2, value: input.dataCompleteness },
  ]);
}

export interface SocialInput {
  /** CSR participation rate (0–100). */
  csrParticipation: number;
  /** Training completion (0–100). */
  trainingCompletion: number;
  /** Engagement + diversity data completion (0–100). */
  engagementDiversity: number;
}

/** Social score: 40% CSR participation · 30% training · 30% engagement & diversity. */
export function socialScore(input: SocialInput): ScoreResult {
  return combine([
    { label: "CSR participation", weight: 0.4, value: input.csrParticipation },
    { label: "Training completion", weight: 0.3, value: input.trainingCompletion },
    { label: "Engagement & diversity", weight: 0.3, value: input.engagementDiversity },
  ]);
}

export interface GovernanceInput {
  /** Policy acknowledgement rate (0–100). */
  policyAcknowledgement: number;
  /** Average audit performance (0–100). */
  auditPerformance: number;
  /** Compliance resolution + overdue performance (0–100). */
  complianceResolution: number;
}

/** Governance score: 35% policy ack · 35% audit performance · 30% compliance. */
export function governanceScore(input: GovernanceInput): ScoreResult {
  return combine([
    { label: "Policy acknowledgement", weight: 0.35, value: input.policyAcknowledgement },
    { label: "Audit performance", weight: 0.35, value: input.auditPerformance },
    { label: "Compliance resolution", weight: 0.3, value: input.complianceResolution },
  ]);
}

/**
 * Compose the compliance sub-score used by governance:
 * 60% resolution rate + 40% overdue performance.
 */
export function complianceScore(input: {
  totalIssues: number;
  resolvedIssues: number;
  overdueIssues: number;
}): number {
  const resolution = rate(input.resolvedIssues, input.totalIssues);
  const overdue = overduePerformance(input.totalIssues, input.overdueIssues);
  if (input.totalIssues <= 0) return 100; // nothing open — perfect
  return round2(clamp(0.6 * resolution + 0.4 * overdue));
}

// ------------------------- Weighted organisation total -------------------------

export interface Weights {
  environmental: number; // percent, e.g. 40
  social: number; // percent, e.g. 30
  governance: number; // percent, e.g. 30
}

/** Weights must be non-negative integers summing to exactly 100. */
export function validateWeights(weights: Weights): { valid: boolean; total: number } {
  const total = weights.environmental + weights.social + weights.governance;
  const valid =
    total === 100 &&
    [weights.environmental, weights.social, weights.governance].every(
      (w) => w >= 0 && w <= 100,
    );
  return { valid, total };
}

/**
 * Weighted overall ESG score:
 * env * wE + soc * wS + gov * wG, where weights are percentages of 100.
 */
export function overallScore(
  scores: { environmental: number; social: number; governance: number },
  weights: Weights,
): number {
  const total = weights.environmental + weights.social + weights.governance;
  const denom = total > 0 ? total : 100;
  const weighted =
    (clamp(scores.environmental) * weights.environmental +
      clamp(scores.social) * weights.social +
      clamp(scores.governance) * weights.governance) /
    denom;
  return round2(clamp(weighted));
}

/** Map a 0–100 score to a letter grade for display. */
export function scoreGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}
