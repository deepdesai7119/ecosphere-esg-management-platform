import type { Capability } from "@/lib/permissions";

/**
 * Role-aware "what can I do here" copy shown by the info icon in the page
 * header. Each action is listed only when the viewer's role holds its
 * capability; actions without a capability apply to every role.
 */
export interface PageInfoAction {
  capability?: Capability;
  label: string;
}

export interface PageInfoEntry {
  /** One-line purpose of the page, shown to every role. */
  about: string;
  actions: PageInfoAction[];
}

export const PAGE_INFO: Record<string, PageInfoEntry> = {
  "/dashboard": {
    about: "Organisation-wide ESG overview with the combined score and module highlights.",
    actions: [
      { label: "View the overall ESG score and per-module statistics" },
      { capability: "score.recalculate", label: "Recalculate the organisation's ESG score" },
    ],
  },
  "/my-work": {
    about: "Your personal queue: items across all modules that are waiting on you.",
    actions: [
      { label: "See and act on your pending acknowledgements, trainings, challenges and approvals" },
    ],
  },

  // ------------------------------ Environmental ------------------------------
  "/environmental": {
    about: "Environmental overview: total emissions, scope breakdown and goal progress.",
    actions: [{ label: "View emission totals, scope 1/2/3 charts and goal progress" }],
  },
  "/environmental/emission-factors": {
    about: "Reference emission factors used to convert operational activity into CO₂e.",
    actions: [
      { label: "View the emission factor library" },
      { capability: "factor.manage", label: "Add, edit and delete emission factors" },
    ],
  },
  "/environmental/product-profiles": {
    about: "ESG profiles for products, including their footprint per unit.",
    actions: [
      { label: "View product ESG profiles" },
      { capability: "product.manage", label: "Add, edit and delete product profiles" },
    ],
  },
  "/environmental/operations": {
    about: "Business operations that generate the organisation's carbon activity.",
    actions: [
      { label: "View recorded business operations" },
      { capability: "operation.manage", label: "Record and delete operations" },
      { capability: "operation.manage", label: "Generate carbon transactions from an operation" },
    ],
  },
  "/environmental/carbon-transactions": {
    about: "Auto-generated ledger of carbon transactions derived from operations.",
    actions: [{ label: "View the read-only carbon transaction ledger" }],
  },
  "/environmental/goals": {
    about: "Environmental reduction goals and their progress.",
    actions: [
      { label: "View goals and progress" },
      { capability: "goal.manage", label: "Create, edit and delete environmental goals" },
    ],
  },

  // --------------------------------- Social ---------------------------------
  "/social": {
    about: "Social overview: CSR activity, participation and training statistics.",
    actions: [{ label: "View CSR and training statistics" }],
  },
  "/social/activities": {
    about: "CSR activities employees can take part in.",
    actions: [
      { label: "Browse CSR activities" },
      { capability: "csr.join", label: "Join an activity" },
      { capability: "csr.manage", label: "Create, edit and delete activities" },
    ],
  },
  "/social/participation": {
    about: "CSR participation records and proof review.",
    actions: [
      { label: "Submit proof for activities you joined" },
      { capability: "csr.approve", label: "Approve or reject submitted participation proof" },
    ],
  },
  "/social/diversity": {
    about: "Aggregated diversity & inclusion metrics — no individual data.",
    actions: [{ label: "View aggregate diversity and training-completion metrics" }],
  },
  "/social/training": {
    about: "ESG trainings assigned across the organisation.",
    actions: [
      { label: "View trainings and mark your assigned trainings complete" },
      { capability: "training.manage", label: "Create, edit and delete trainings" },
    ],
  },

  // ------------------------------- Governance -------------------------------
  "/governance": {
    about: "Governance overview: policies, audits and compliance health.",
    actions: [
      { label: "View policy, audit and compliance statistics" },
      { capability: "compliance.manage", label: "Run an on-demand compliance check" },
    ],
  },
  "/governance/policies": {
    about: "Published governance policies requiring employee acknowledgement.",
    actions: [
      { label: "Read published policies" },
      { capability: "policy.manage", label: "Create, edit and delete policies" },
    ],
  },
  "/governance/acknowledgements": {
    about: "Policy acknowledgements — yours and, for managers, everyone's.",
    actions: [
      { capability: "policy.acknowledge", label: "Acknowledge policies assigned to you" },
      { capability: "policy.manage", label: "See acknowledgement status across the organisation" },
    ],
  },
  "/governance/audits": {
    about: "Internal and external ESG audits with scores and findings.",
    actions: [
      { label: "View audit history" },
      { capability: "audit.manage", label: "Schedule, edit and delete audits" },
    ],
  },
  "/governance/compliance": {
    about: "Compliance issues, their owners and due dates.",
    actions: [
      { label: "View compliance issues" },
      { capability: "compliance.manage", label: "Create, edit, delete issues and run compliance checks" },
    ],
  },

  // ------------------------------ Gamification ------------------------------
  "/gamification": {
    about: "Gamification overview: challenges, points and engagement.",
    actions: [{ label: "View challenge and engagement statistics" }],
  },
  "/gamification/challenges": {
    about: "Sustainability challenges employees can join to earn points.",
    actions: [
      { label: "Browse challenges" },
      { capability: "challenge.join", label: "Join a challenge" },
      { capability: "challenge.manage", label: "Create, edit and delete challenges" },
    ],
  },
  "/gamification/participation": {
    about: "Challenge participation and progress review.",
    actions: [
      { label: "Log progress on challenges you joined" },
      { capability: "challenge.approve", label: "Approve or reject challenge submissions" },
    ],
  },
  "/gamification/badges": {
    about: "Badges awarded for milestones and achievements.",
    actions: [
      { label: "View available badges and who earned them" },
      { capability: "badge.manage", label: "Create, edit and delete badges" },
    ],
  },
  "/gamification/rewards": {
    about: "Rewards that can be redeemed with earned points.",
    actions: [
      { label: "Browse the reward catalogue" },
      { capability: "reward.redeem", label: "Redeem rewards with your points" },
      { capability: "reward.manage", label: "Create, edit and delete rewards" },
      { capability: "redemption.process", label: "Process pending reward redemptions" },
    ],
  },
  "/gamification/leaderboard": {
    about: "Points leaderboard across the organisation.",
    actions: [{ label: "View individual and department rankings" }],
  },

  // --------------------------------- Reports --------------------------------
  "/reports": {
    about: "Entry point for environmental, social, governance and custom reports.",
    actions: [{ capability: "report.generate", label: "Open, generate and export reports" }],
  },
  "/reports/environmental": {
    about: "Environmental report over a chosen period.",
    actions: [{ capability: "report.generate", label: "Filter the report and export PDF / Excel / CSV" }],
  },
  "/reports/social": {
    about: "Social report over a chosen period.",
    actions: [{ capability: "report.generate", label: "Filter the report and export PDF / Excel / CSV" }],
  },
  "/reports/governance": {
    about: "Governance report over a chosen period.",
    actions: [{ capability: "report.generate", label: "Filter the report and export PDF / Excel / CSV" }],
  },
  "/reports/esg-summary": {
    about: "Combined ESG summary report.",
    actions: [{ capability: "report.generate", label: "Filter the report and export PDF / Excel / CSV" }],
  },
  "/reports/custom": {
    about: "Custom report builder with selectable sections and filters.",
    actions: [{ capability: "report.generate", label: "Build, run and export custom reports" }],
  },

  // -------------------------------- Settings --------------------------------
  "/settings/departments": {
    about: "Departments used to scope users, goals and operations.",
    actions: [{ capability: "department.manage", label: "Create, edit and delete departments" }],
  },
  "/settings/categories": {
    about: "Categories used across CSR activities, challenges and trainings.",
    actions: [{ capability: "category.manage", label: "Create, edit and delete categories" }],
  },
  "/settings/users": {
    about: "User accounts, roles and department assignments.",
    actions: [{ capability: "user.manage", label: "Invite users and change their role or department" }],
  },
  "/settings/esg-configuration": {
    about: "Weights and parameters behind the ESG score calculation.",
    actions: [{ capability: "esgConfig.manage", label: "Adjust ESG scoring configuration" }],
  },
  "/settings/notifications": {
    about: "Notification preferences and organisation-wide announcements.",
    actions: [
      { label: "Manage your own notification preferences" },
      { capability: "notification.broadcast", label: "Send organisation-wide announcements" },
    ],
  },
};

/**
 * Resolve the registry entry for a pathname, walking up path segments so
 * detail pages (e.g. /gamification/challenges/123) inherit their parent's
 * entry.
 */
export function pageInfoFor(pathname: string): PageInfoEntry | null {
  let path = pathname.replace(/\/+$/, "") || "/";
  while (path.length > 0) {
    const entry = PAGE_INFO[path];
    if (entry) return entry;
    const idx = path.lastIndexOf("/");
    if (idx <= 0) break;
    path = path.slice(0, idx);
  }
  return null;
}
