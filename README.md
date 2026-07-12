# VerdantIQ

**ESG Operations, Engagement & Compliance Platform**

A standalone, database-backed **Next.js 16 + MySQL 8** application for managing an
organisation's Environmental, Social and Governance programme end to end —
automated carbon accounting, CSR & training engagement, governance/audit/compliance
tracking, gamification, transparent ESG scoring and exportable reporting.

Built for a live hackathon demo: every form, approval, calculation, notification,
filter and report is functional and persists to MySQL. No Odoo, Python, Supabase,
Firebase, MongoDB or separate backend — a single clean Next.js monolith.

---

## Feature overview

| Module | What works |
|--------|-----------|
| **Dashboard** | Live E/S/G + overall score cards, 12-month emissions trend, emissions by scope, department ranking, ESG score trend, engagement tiles, recent activity, quick actions, **score-methodology drawer**, **recalculate scores** |
| **Environmental** | CRUD for emission factors, product ESG profiles, business operations, goals; **automatic CO₂e = quantity × factor** on operation create; carbon transaction ledger; scope summaries; goal progress |
| **Social** | CSR activities with capacity + join; participation approval queue with **backend-enforced evidence rule**; points awarded once; aggregated diversity dashboard; training completion |
| **Governance** | Policies with auto-generated acknowledgement rows; acknowledgement tracking; audits; compliance issues with severity/owner/due-date, **overdue detection**, and a protected sweep job |
| **Gamification** | Challenge lifecycle (Draft→Active→Under Review→Completed→Archived); participation approval + XP awarded once; **auto-awarded badges (never duplicated)**; rewards with **atomic points+stock redemption**; leaderboard |
| **Reports** | Environmental / Social / Governance / ESG-Summary / Custom builder; **PDF, Excel and CSV** export of real filtered data; filters persisted in the URL |
| **Settings** | Departments, categories, users (+password reset), ESG configuration with **weight-sum validation**, org + per-user notification preferences |
| **Platform** | Role-based auth (5 roles), in-app notifications + email adapter, file uploads, activity log, My Work task hub |

---

## Technology stack

- **Framework:** Next.js 16 (App Router, Route Handlers, RSC) · React 19 · TypeScript (strict)
- **UI:** Tailwind CSS v4 · shadcn/ui · Lucide · Recharts · TanStack Table · Sonner
- **Data & forms:** React Hook Form · Zod v4
- **Backend:** Server service layer + repositories · Prisma ORM 6 · MySQL 8
- **Auth:** Auth.js (next-auth v5, credentials) · bcryptjs · JWT sessions · middleware
- **Reports:** ExcelJS (Excel) · pdf-lib (PDF) · native CSV
- **Testing:** Vitest · Testing Library · Playwright (config)
- **Infra:** Docker Compose (MySQL) · Prisma migrations + seed

---

## Architecture (short)

```
src/
  app/(auth)/login              # sign-in
  app/(dashboard)/*             # all module pages (server components)
  app/api/*                     # route handlers (thin; call services)
  components/{layout,shared,ui} # app shell, shared UI, shadcn primitives
  lib/{auth,api,permissions,esg,uploads,notifications,validations}
  server/services/*             # business logic (transactions, workflows)
  server/repositories/*         # complex aggregate queries
prisma/{schema.prisma,seed.ts}
```

Pages are **server components** that read via Prisma and enforce `requireUser()` +
capability checks. Mutations go through **Route Handlers** → **Zod validation** →
**service layer** (Prisma transactions for points/emissions/scores). See
[ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Local setup

### Prerequisites
- Node 20+ (tested on Node 24) and npm
- A MySQL 8 database — either **Docker** or a **local MySQL** install

### 1. Install
```bash
npm install
```

### 2. Start MySQL

**Option A — Docker (recommended):**
```bash
npm run db:up          # docker compose up -d  (MySQL 8 on :3306)
```

**Option B — local Homebrew MySQL:**
```bash
brew install mysql && brew services start mysql
mysql -u root -e "CREATE DATABASE IF NOT EXISTS verdantiq;
  CREATE USER IF NOT EXISTS 'verdantiq'@'127.0.0.1' IDENTIFIED BY 'verdantiq';
  GRANT ALL PRIVILEGES ON *.* TO 'verdantiq'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;"
```

### 3. Environment
```bash
cp .env.example .env
# then set AUTH_SECRET (openssl rand -base64 32) and CRON_SECRET (openssl rand -hex 16)
```
Default `DATABASE_URL` already points at `mysql://verdantiq:verdantiq@127.0.0.1:3306/verdantiq`.

### 4. Migrate + seed
```bash
npm run db:migrate     # prisma migrate dev
npm run db:seed        # realistic GreenWorks demo data
```

### 5. Run
```bash
npm run dev            # http://localhost:3000
```

---

## Demo credentials

All accounts use password **`Demo@123`**.

| Role | Email |
|------|-------|
| Organisation Admin | `admin@verdantiq.demo` |
| ESG Manager | `manager@verdantiq.demo` |
| Department Head | `head@verdantiq.demo` |
| Employee | `employee@verdantiq.demo` |
| Auditor | `auditor@verdantiq.demo` |

---

## npm scripts

| Script | Purpose |
|--------|---------|
| `dev` / `build` / `start` | Next.js dev / production build / serve |
| `lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `test` / `test:watch` / `test:e2e` | Vitest / watch / Playwright |
| `db:up` / `db:down` | Docker MySQL up / down |
| `db:migrate` / `db:deploy` / `db:reset` | Prisma migrate dev / deploy / reset |
| `db:seed` / `db:studio` / `db:generate` | Seed / Prisma Studio / generate client |

---

## ESG scoring (transparent & tested)

Pure, unit-tested functions in `src/lib/esg/scoring.ts`:

- **Environmental** = 50% goal progress + 30% emission-reduction trend + 20% data completeness
- **Social** = 40% CSR participation + 30% training completion + 30% engagement & diversity
- **Governance** = 35% policy acknowledgement + 35% audit performance + 30% compliance resolution
- **Overall** = `env·wE + soc·wS + gov·wG` (default weights 40/30/30, editable in Settings; must sum to 100)

All scores are clamped 0–100; the dashboard **"How is this calculated?"** drawer
shows each component's weight and contribution.

---

## Reports & exports

Every report reads **real, filtered** data (department, date range, module,
employee, challenge, ESG category). Export as:
- **PDF** — via `pdf-lib` (no external font files; server-safe)
- **Excel** — via `exceljs` (one sheet per section)
- **CSV** — native

Custom Report Builder persists its filter selection in the URL query string.

## Notification behaviour

In-app notifications always work (DB-backed bell with unread count, mark
one/all read, 30s poll). Email is **best-effort**: when `RESEND_API_KEY` is set,
messages are sent via the Resend HTTP API; otherwise the email event is logged to
the server console in development and nothing crashes. Organisation- and
user-level toggles gate delivery.

## File storage

Proof and policy uploads use a **storage abstraction** with a local-filesystem
adapter (`storage/uploads/…`), served through the protected `/api/files/[...]`
route. PDF/PNG/JPG only, ≤ 5 MB, unique server-generated filenames (the original
filename is never trusted). To move to S3, implement `saveUpload`/`readUpload` in
`src/lib/uploads/storage.ts` against the AWS SDK — callers only depend on the
returned URL.

## Overdue-compliance job

`POST /api/jobs/check-overdue-compliance` flags newly-overdue issues and notifies
owners + managers. Protected by `Authorization: Bearer $CRON_SECRET` for cron, or a
signed-in user with `compliance.manage` (the in-app **"Run Compliance Check"** button).

---

## Testing

```bash
npm run test        # 31 unit tests (scoring, weights, lifecycle, emission, overdue)
npm run typecheck   # 0 errors
npm run lint        # 0 errors
npm run build       # production build
```

---

## Known hackathon limitations

- Single-organisation tenancy; `organizationId` is an indexed scalar on
  transactional models (kept lean by design).
- `bcryptjs` is used instead of native `bcrypt` (identical hashing, no native
  build step — reliable on Node 24).
- Email sending requires a `RESEND_API_KEY`; without it, emails are logged only.
- Playwright e2e is configured but the primary automated coverage is the Vitest
  unit suite plus a scripted happy-path smoke test.
- Prisma 6 is used (not the newest Prisma 7, which requires driver adapters) for
  demo reliability.
