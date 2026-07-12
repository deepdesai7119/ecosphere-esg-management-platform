import { getComplianceRisk, getEsgScoreHistory, getMonthlyEmissions, type MonthlySeriesPoint } from "./data";
import { forecastNext, linearRegression, percentChange, round, trendDirection } from "./stats";

export interface ChatbotContext {
  organizationId: string;
  departmentId: string | null;
}

export interface ChatbotReply {
  text: string;
  /** Optional structured data the UI can render as a small inline chart/table. */
  series?: MonthlySeriesPoint[];
}

type Intent =
  | "emissions_trend"
  | "esg_score_trend"
  | "compliance_risk"
  | "help"
  | "greeting";

function detectIntent(message: string): Intent {
  const m = message.toLowerCase();

  if (/\b(hi|hello|hey)\b/.test(m) && m.length < 20) return "greeting";

  if (
    /(compliance|audit|overdue|risk of (going|being) late|deadline)/.test(m)
  ) {
    return "compliance_risk";
  }

  if (
    /(esg score|overall score|governance score|social score|environmental score)/.test(m)
  ) {
    return "esg_score_trend";
  }

  if (
    /(emission|carbon|co2|co₂|scope 1|scope 2|scope 3|footprint)/.test(m)
  ) {
    return "emissions_trend";
  }

  if (/(help|what can you|options|capabilities)/.test(m)) return "help";

  // Default: most people asking a vague "how are we doing" question want the
  // headline number, so treat unmatched messages as an ESG score question.
  return "esg_score_trend";
}

function toPoints(series: MonthlySeriesPoint[]) {
  return series.map((s, i) => ({ x: i, y: s.value }));
}

function seriesMean(series: MonthlySeriesPoint[]): number {
  if (series.length === 0) return 0;
  return series.reduce((s, p) => s + p.value, 0) / series.length;
}

async function replyEmissionsTrend(ctx: ChatbotContext): Promise<ChatbotReply> {
  const series = await getMonthlyEmissions(ctx.organizationId, ctx.departmentId, 12);
  const withData = series.filter((s) => s.value > 0);
  if (withData.length < 2) {
    return {
      text: "There isn't enough emissions history yet to spot a trend — log a few more months of operations and carbon transactions and I'll be able to forecast.",
      series,
    };
  }

  const points = toPoints(series);
  const { slope, r2 } = linearRegression(points);
  const direction = trendDirection(slope, seriesMean(series));
  const last = series[series.length - 1].value;
  const first = series[0].value;
  const change = round(percentChange(first, last), 1);
  const nextMonth = Math.max(0, round(forecastNext(points, 1), 2));
  const confidence = r2 > 0.5 ? "fairly consistent" : "noisy — treat this as a rough estimate";

  const dirWord = direction === "rising" ? "increased" : direction === "falling" ? "decreased" : "stayed roughly flat";

  const text =
    `Emissions have ${dirWord} over the last ${series.length} months (${first} t → ${last} t, ${change >= 0 ? "+" : ""}${change}%). ` +
    `Based on that trend, next month is projected at roughly **${nextMonth} tCO₂e**. ` +
    `The trend line is ${confidence} (fit R² = ${round(r2, 2)}).`;

  return { text, series };
}

async function replyEsgScoreTrend(ctx: ChatbotContext): Promise<ChatbotReply> {
  const series = await getEsgScoreHistory(ctx.organizationId);
  if (series.length < 2) {
    return {
      text: `The current ESG score is ${series[0]?.value ?? "—"}/100. There's only one recorded snapshot so far — run "Recalculate Scores" periodically (e.g. monthly) to build up history for trend forecasting.`,
      series,
    };
  }

  const points = toPoints(series);
  const { slope, r2 } = linearRegression(points);
  const direction = trendDirection(slope, seriesMean(series));
  const last = series[series.length - 1].value;
  const first = series[0].value;
  const nextPeriod = Math.min(100, Math.max(0, round(forecastNext(points, 1), 1)));
  const dirWord = direction === "rising" ? "improving" : direction === "falling" ? "declining" : "holding steady";

  const text =
    `The overall ESG score has been **${dirWord}**, moving from ${first} to ${last} across ${series.length} recorded periods. ` +
    `Projected next-period score: **~${nextPeriod}/100** (fit R² = ${round(r2, 2)}). ` +
    (direction === "falling"
      ? "Worth digging into which pillar (environmental, social, or governance) is dragging it down via the dashboard's methodology drawer."
      : "");

  return { text: text.trim(), series };
}

async function replyComplianceRisk(ctx: ChatbotContext): Promise<ChatbotReply> {
  const risk = await getComplianceRisk(ctx.organizationId, ctx.departmentId);

  if (risk.openCount === 0) {
    return { text: "No open or in-progress compliance issues right now — nothing to flag." };
  }

  const lines: string[] = [];
  lines.push(
    `Of ${risk.openCount} open compliance issue${risk.openCount === 1 ? "" : "s"}, ${risk.overdueCount} ${risk.overdueCount === 1 ? "is" : "are"} already overdue.`,
  );
  if (risk.avgResolutionDays !== null) {
    lines.push(`Historically, issues take about ${risk.avgResolutionDays} days to resolve once opened.`);
  }

  if (risk.atRiskItems.length > 0) {
    lines.push("", "Likely to slip if not prioritized:");
    for (const item of risk.atRiskItems.slice(0, 5)) {
      const due =
        item.daysUntilDue === null
          ? "no due date"
          : item.daysUntilDue < 0
            ? `${Math.abs(item.daysUntilDue)} days overdue`
            : `due in ${item.daysUntilDue} days`;
      lines.push(`• [${item.severity}] ${item.title} — ${due}`);
    }
    if (risk.atRiskItems.length > 5) {
      lines.push(`…and ${risk.atRiskItems.length - 5} more.`);
    }
  } else {
    lines.push("Everything else currently has comfortable runway before its due date.");
  }

  return { text: lines.join("\n") };
}

function replyHelp(): ChatbotReply {
  return {
    text:
      "I can analyze your ESG data and give you predictions. Try asking:\n" +
      "• \"What's our emissions trend?\" — forecasts next month's tCO₂e\n" +
      "• \"How is our ESG score trending?\" — forecasts the next period's score\n" +
      "• \"Which compliance issues are at risk?\" — flags likely-to-be-overdue items\n",
  };
}

function replyGreeting(): ChatbotReply {
  return {
    text: "Hi! I'm your ESG analytics assistant. Ask me about emissions trends, ESG score trajectory, or compliance risk — I'll analyze your organization's data and give you a forecast.",
  };
}

/** Entry point used by the API route. */
export async function answerChatbotMessage(
  message: string,
  ctx: ChatbotContext,
): Promise<ChatbotReply> {
  const intent = detectIntent(message);
  switch (intent) {
    case "emissions_trend":
      return replyEmissionsTrend(ctx);
    case "esg_score_trend":
      return replyEsgScoreTrend(ctx);
    case "compliance_risk":
      return replyComplianceRisk(ctx);
    case "greeting":
      return replyGreeting();
    case "help":
    default:
      return replyHelp();
  }
}
