# VerdantIQ — Architecture

## Layers

```
Browser (React 19 client components)
   │  fetch  → src/lib/api-client.ts  (typed { ok, data, error } envelope)
   ▼
Route Handlers  src/app/api/**        (thin: auth + Zod + call a service)
   │
   ▼
Service layer   src/server/services/* (business rules, Prisma transactions)
   │
   ▼
Prisma ORM  →  MySQL 8
```

**Server Components** (all module pages) read directly from Prisma and enforce
`requireUser()` + capability checks before rendering. **Client Components**
(`*-client.tsx`) handle interactivity and mutate through the API client.

## Request lifecycle (a mutation)

1. Client component calls `api.post("/api/...", body)`.
2. Route handler wraps logic in `handle(async () => …)`:
   - `requireApiUser()` / `requireApiCapability(cap)` — 401/403 on failure.
   - `parseBody(req, zodSchema)` — 400 on invalid input.
   - Calls a **service** function.
3. Service performs the work (often a `prisma.$transaction`), writes an
   **activity log**, and fires **notifications**.
4. Standard envelope returned: `{ ok: true, data }` or `{ ok: false, error }`.
5. Client toasts + `router.refresh()` to re-render the server component.

## Key modules

| Concern | Location |
|--------|----------|
| Auth (edge-safe config, credentials, session helpers) | `src/lib/auth/*` |
| Permissions (capability matrix, department scoping) | `src/lib/permissions/index.ts` |
| API envelope + guards | `src/lib/api/index.ts` |
| ESG scoring (pure, tested) | `src/lib/esg/scoring.ts`, `calculations.ts`, `challengeLifecycle.ts` |
| Generic CRUD helpers | `src/server/crud.ts` |
| Services | `src/server/services/*.service.ts` |
| Aggregate queries | `src/server/repositories/*` |
| Reports | `report.service.ts` + `src/lib/reports/exporters.ts` |
| Uploads / email adapters | `src/lib/uploads`, `src/lib/notifications` |

## Data model highlights

- **Single organisation** root; `organizationId` is an indexed scalar on
  transactional models. `User`, `Department`, `EsgConfiguration` relate to it.
- **Decimal** columns for quantities, emission factors, calculated CO₂e and scores.
- Business-rule-enforcing **unique constraints**:
  - `EmployeeBadge (employeeId, badgeId)` — a badge is never awarded twice.
  - `CsrParticipation / ChallengeParticipation / PolicyAcknowledgement / TrainingCompletion` — one row per employee per item.
  - `EsgPolicy (organizationId, code, version)`, `Department (organizationId, code)`, `Category (organizationId, type, name)`.
- Indexed on `organizationId`, `departmentId`, `status`, dates, `email`.

## Correctness guarantees (transactions)

- **Reward redemption** — points and stock are deducted with conditional
  `updateMany` guards inside one transaction, so concurrent requests can't
  over-spend or oversell (the second update matches 0 rows → rollback).
- **Emission calculation** — operation + its carbon transaction are created in a
  single transaction when auto-calc is enabled.
- **Approvals** — XP/points are credited exactly once (idempotent across
  re-reviews) and the evidence rule is enforced **server-side**, not just in the UI.
- **Score recalculation** — recomputes pillar/overall scores from live data and
  snapshots them to `DepartmentScore`.

## Auth & authorisation

- Auth.js v5 credentials provider with bcryptjs; **JWT** session strategy.
- Edge-safe `authConfig` powers middleware (redirects unauthenticated users);
  the Node-only `authorize` (Prisma + bcrypt) lives in `auth.ts`.
- Five roles → capability matrix (`can(role, capability)`); department-scoped
  actions checked via `canActOnDepartment`.

## Rendering & theming

- Dark graphite chrome (sidebar + topbar) around a light content area; module
  colour-coding (green/blue/purple/orange) via Tailwind v4 `@theme` tokens.
- Light/dark mode via `next-themes`; charts theme-aware through CSS variables.
- Fully responsive: collapsible drawer sidebar, stacked cards, horizontally
  scrollable tables.
