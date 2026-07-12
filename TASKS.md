# VerdantIQ — Implementation Checklist

Legend: `[x]` done · `[~]` partial

## Foundation
- [x] Next.js 16 (App Router, TS strict, Tailwind v4, src dir, ESLint)
- [x] shadcn/ui + Lucide + Recharts + TanStack Table + RHF + Zod + Sonner + date-fns
- [x] Prisma 6 + MySQL 8 (Docker Compose + local Homebrew instance)
- [x] Auth.js (credentials) + bcryptjs + JWT sessions + middleware
- [x] `.env.example`, brand design tokens, fonts (Inter + JetBrains Mono)

## Database
- [x] Complete Prisma schema (30 models, enums, indexes, unique constraints)
- [x] Decimal for quantities / emissions / scores; audit fields
- [x] Migration (`init`) + Prisma client generated
- [x] Comprehensive seed (GreenWorks Industries, 17 users, 12mo of data)

## Core services (server)
- [x] emissionCalculationService (auto carbon on operation create)
- [x] scoreCalculationService (pillar + weighted org/department scores, persist)
- [x] notificationService (in-app + email adapter, prefs-aware)
- [x] badgeEvaluationService (auto-award, never duplicated — DB unique)
- [x] rewardRedemptionService (atomic points + stock in one transaction)
- [x] complianceService (overdue detection + notifications)
- [x] reportService (5 datasets) + exporters (PDF/Excel/CSV)
- [x] csr / challenge / policy / user / config / activityLog services
- [x] Permission utility (capability matrix + department scoping)

## Modules (routes + API + workflows)
- [x] Dashboard — score cards, emissions/scope/score charts, ranking, activity, quick actions, score explainer, recalculate
- [x] Environmental — factors, product profiles, operations (+auto carbon), carbon transactions, goals
- [x] Social — CSR activities (join), participation approval (evidence rule), diversity (aggregated), training
- [x] Governance — policies (+auto acknowledgement rows), acknowledgements, audits, compliance (+overdue job)
- [x] Gamification — challenges (lifecycle), participation, badges (auto-award), rewards (redeem), leaderboard
- [x] Reports — environmental/social/governance/esg-summary/custom + PDF/Excel/CSV export + URL-persisted filters
- [x] Settings — departments, categories, users (+reset password), ESG configuration (weight validation), notifications
- [x] My Work — personal task hub (acks, participations, proofs, approvals)
- [x] Notifications — bell (poll, mark read/all), protected job route (CRON_SECRET)
- [x] File uploads — local storage adapter + protected download route

## Quality gates
- [x] `npm run typecheck` — 0 errors
- [x] `npm run lint` — 0 errors
- [x] `npm run test` — 31 unit tests pass (scoring, weights, lifecycle, emission, overdue)
- [x] `npm run build` — succeeds (60+ routes)
- [x] Happy-path smoke test (login, auto-carbon, approvals, redeem, exports)
- [~] Playwright e2e — scaffolded config; unit coverage prioritised for the hackathon

## Docs
- [x] README.md · ARCHITECTURE.md · DEMO_GUIDE.md · TASKS.md
