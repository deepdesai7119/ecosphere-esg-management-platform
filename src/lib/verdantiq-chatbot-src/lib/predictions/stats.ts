/**
 * Lightweight statistics for the chatbot's predictions. Deliberately dependency-free
 * (ordinary least squares + moving average) — no ML libraries, no external calls.
 */

export interface Point {
  x: number; // e.g. month index 0..n-1
  y: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  /** R² goodness of fit, 0..1. Low values mean the trend line is not very reliable. */
  r2: number;
}

/** Ordinary least squares regression over evenly-spaced points. */
export function linearRegression(points: Point[]): RegressionResult {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const predicted = slope * p.x + intercept;
    ssRes += (p.y - predicted) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

/** Forecast the value `stepsAhead` points beyond the last point in the series. */
export function forecastNext(points: Point[], stepsAhead = 1): number {
  const { slope, intercept } = linearRegression(points);
  const lastX = points.length ? points[points.length - 1].x : 0;
  return slope * (lastX + stepsAhead) + intercept;
}

/** Simple trailing moving average, same length as input (shorter window at the start). */
export function movingAverage(values: number[], window = 3): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

/** Percent change between the first and last value of a series. */
export function percentChange(first: number, last: number): number {
  if (first === 0) return last === 0 ? 0 : 100;
  return ((last - first) / Math.abs(first)) * 100;
}

export type TrendDirection = "rising" | "falling" | "flat";

/** Classify a slope as rising/falling/flat relative to the series' own scale. */
export function trendDirection(slope: number, seriesMean: number): "rising" | "falling" | "flat" {
  if (seriesMean === 0) return slope === 0 ? "flat" : slope > 0 ? "rising" : "falling";
  const relativeSlope = slope / Math.abs(seriesMean);
  if (relativeSlope > 0.03) return "rising";
  if (relativeSlope < -0.03) return "falling";
  return "flat";
}

export function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
