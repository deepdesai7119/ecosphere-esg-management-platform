# VerdantIQ — 5–7 minute demo script

> Setup: `npm run db:seed` for a pristine state, then `npm run dev`.
> Open http://localhost:3000. All passwords: **`Demo@123`**.

---

### 1 · Login as Administrator (0:00)
Sign in as `admin@verdantiq.demo`. Land on the **Executive ESG Dashboard**.

### 2 · Executive Dashboard (0:30)
Point out the four **score cards** (Environmental / Social / Governance / Overall),
the **12-month emissions trend**, **emissions by scope** donut, **department
ranking**, and the engagement tiles (CSR %, policy ack %, open/overdue compliance).
Click **"How is this calculated?"** — the drawer shows each score's weighted
components. Click **"Recalculate scores"** to recompute live from the database.

### 3 · Create a business operation → automatic carbon (1:15)
Go to **Environmental → Operations → New Operation**. Choose a type (e.g. Fleet),
pick an **emission factor**, enter a quantity and unit, save. Open **Carbon
Transactions** — the CO₂e was **auto-calculated** (`quantity × factor`) and logged.

### 4 · Environmental goals (2:00)
**Environmental → Goals** (or the overview) — show target-vs-actual progress bars
and statuses (On Track / Completed / At Risk).

### 5 · Switch to Employee (2:30)
Sign out, log in as `employee@verdantiq.demo` (Aditi Rao). Open **My Work** — her
XP, points, badges, pending policy acknowledgements and challenge/CSR tasks.

### 6 · Join & submit evidence (3:00)
- **Social → CSR Activities** → **Join** an activity (e.g. Tree Plantation), then
  upload a proof file on **My Work / Participation**.
- **Gamification → Challenges** → **Join** an active challenge and submit proof.

### 7 · Approve as Manager (3:45)
Sign in as `manager@verdantiq.demo`. Go to **Social → Participation** and
**Approve** Aditi's submission. (Try approving without proof when evidence is
required — the backend blocks it.) Do the same in **Gamification → Participation**.

### 8 · XP, badge & leaderboard update (4:30)
Back as the employee (or on the leaderboard), show the awarded **XP/points**, an
**auto-unlocked badge**, and her position on the **Gamification → Leaderboard**.

### 9 · Redeem a reward (5:00)
As the employee, **Gamification → Rewards → Redeem**. Points are deducted
atomically and a redemption appears in the manager's queue (Pending → Fulfil).

### 10 · Compliance & overdue warning (5:30)
Sign in as `admin` (or `auditor@verdantiq.demo`). **Governance → Compliance** —
show severity-tagged issues, the **overdue** ones highlighted in red, and click
**"Run Compliance Check"** to sweep for newly-overdue items. The governance
overview surfaces overdue issues prominently.

### 11 · Generate an ESG report (6:15)
**Reports → ESG Summary** — filter by department/date, then export as **PDF**,
**Excel** or **CSV** (real filtered data). Show the **Custom Report Builder** with
its URL-persisted filters.

### 12 · Wrap up (6:45)
Return to the **Dashboard** — recap the **department ranking** and **overall ESG
score**, reinforcing that every number is computed live from the seeded database
through transparent, tested scoring functions.

---

## Quick talking points
- **Everything persists** to MySQL — no mock data or fake CRUD.
- **Business rules enforced server-side**: evidence requirement, one-time
  XP/points, never-duplicate badges, atomic reward redemption.
- **Settings affect logic**: toggle auto emission calc / evidence requirement /
  badge auto-award, or change ESG weights (must sum to 100), and behaviour changes.
- **Role-based**: Admin, ESG Manager, Department Head, Employee, Auditor.
