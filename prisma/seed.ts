/* eslint-disable no-console */
import {
  PrismaClient,
  Role,
  CategoryType,
  EmissionScope,
  OperationType,
  GoalStatus,
  ApprovalStatus,
  ChallengeStatus,
  Difficulty,
  PolicyStatus,
  AckStatus,
  AuditType,
  AuditStatus,
  Severity,
  ComplianceStatus,
  UnlockMetric,
  RedemptionStatus,
  TrainingCompletionStatus,
  EmploymentType,
  Gender,
  NotificationType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@123";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  return daysAgo(-n);
}
function monthStart(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack, 15);
  d.setHours(9, 0, 0, 0);
  return d;
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  console.log("🌱 Seeding VerdantIQ demo data…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- Clean slate (respecting FK order) ----
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.notificationPreference.deleteMany(),
    prisma.rewardRedemption.deleteMany(),
    prisma.employeeBadge.deleteMany(),
    prisma.challengeParticipation.deleteMany(),
    prisma.csrParticipation.deleteMany(),
    prisma.trainingCompletion.deleteMany(),
    prisma.policyAcknowledgement.deleteMany(),
    prisma.departmentScore.deleteMany(),
    prisma.carbonTransaction.deleteMany(),
    prisma.businessOperation.deleteMany(),
  ]);
  await prisma.$transaction([
    prisma.reward.deleteMany(),
    prisma.badge.deleteMany(),
    prisma.challenge.deleteMany(),
    prisma.csrActivity.deleteMany(),
    prisma.training.deleteMany(),
    prisma.complianceIssue.deleteMany(),
    prisma.audit.deleteMany(),
    prisma.esgPolicy.deleteMany(),
    prisma.environmentalGoal.deleteMany(),
    prisma.productEsgProfile.deleteMany(),
    prisma.emissionFactor.deleteMany(),
    prisma.category.deleteMany(),
  ]);
  await prisma.esgConfiguration.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();

  // ---- Organisation + config ----
  const org = await prisma.organization.create({
    data: {
      name: "GreenWorks Industries",
      code: "GREENWORKS",
      environmentalWeight: 40,
      socialWeight: 30,
      governanceWeight: 30,
    },
  });
  await prisma.esgConfiguration.create({
    data: {
      organizationId: org.id,
      autoEmissionCalculationEnabled: true,
      evidenceRequiredForCsrApproval: true,
      badgeAutoAwardEnabled: true,
      emailNotificationsEnabled: false,
      inAppNotificationsEnabled: true,
      complianceReminderEnabled: true,
      policyReminderEnabled: true,
    },
  });

  // ---- Departments ----
  const deptData = [
    { name: "Manufacturing", code: "MFG" },
    { name: "Logistics", code: "LOG" },
    { name: "Procurement", code: "PROC" },
    { name: "Corporate", code: "CORP" },
    { name: "Sustainability", code: "SUS" },
  ];
  const departments: Record<string, string> = {};
  for (const d of deptData) {
    const dept = await prisma.department.create({
      data: { organizationId: org.id, name: d.name, code: d.code },
    });
    departments[d.code] = dept.id;
  }

  // ---- Users ----
  interface SeedUser {
    name: string;
    email: string;
    role: Role;
    dept: string;
    xp: number;
    points: number;
    completed: number;
    gender: Gender;
    designation: string;
  }
  const demoUsers: SeedUser[] = [
    { name: "Alex Mehta", email: "admin@verdantiq.demo", role: Role.ORG_ADMIN, dept: "CORP", xp: 1200, points: 400, completed: 4, gender: Gender.MALE, designation: "Chief Sustainability Officer" },
    { name: "Priya Nair", email: "manager@verdantiq.demo", role: Role.ESG_MANAGER, dept: "SUS", xp: 2100, points: 620, completed: 7, gender: Gender.FEMALE, designation: "ESG Programme Manager" },
    { name: "Suresh Nair", email: "head@verdantiq.demo", role: Role.DEPARTMENT_HEAD, dept: "MFG", xp: 1650, points: 380, completed: 5, gender: Gender.MALE, designation: "Head of Manufacturing" },
    { name: "Aditi Rao", email: "employee@verdantiq.demo", role: Role.EMPLOYEE, dept: "MFG", xp: 3910, points: 910, completed: 9, gender: Gender.FEMALE, designation: "Process Engineer" },
    { name: "Ravi Iyer", email: "auditor@verdantiq.demo", role: Role.AUDITOR, dept: "CORP", xp: 700, points: 120, completed: 2, gender: Gender.MALE, designation: "Internal Auditor" },
  ];
  const extraUsers: SeedUser[] = [
    { name: "Karan Shah", email: "karan@verdantiq.demo", role: Role.EMPLOYEE, dept: "LOG", xp: 2760, points: 540, completed: 6, gender: Gender.MALE, designation: "Fleet Coordinator" },
    { name: "Meera Krishnan", email: "meera@verdantiq.demo", role: Role.EMPLOYEE, dept: "MFG", xp: 2540, points: 480, completed: 6, gender: Gender.FEMALE, designation: "Line Supervisor" },
    { name: "Rohit Verma", email: "rohit@verdantiq.demo", role: Role.EMPLOYEE, dept: "PROC", xp: 1980, points: 360, completed: 4, gender: Gender.MALE, designation: "Procurement Analyst" },
    { name: "Sneha Pillai", email: "sneha@verdantiq.demo", role: Role.EMPLOYEE, dept: "CORP", xp: 2320, points: 430, completed: 5, gender: Gender.FEMALE, designation: "HR Business Partner" },
    { name: "Vikram Das", email: "vikram@verdantiq.demo", role: Role.EMPLOYEE, dept: "LOG", xp: 1740, points: 300, completed: 3, gender: Gender.MALE, designation: "Logistics Executive" },
    { name: "Ananya Bose", email: "ananya@verdantiq.demo", role: Role.EMPLOYEE, dept: "SUS", xp: 2890, points: 610, completed: 7, gender: Gender.FEMALE, designation: "Sustainability Analyst" },
    { name: "Deepak Menon", email: "deepak@verdantiq.demo", role: Role.DEPARTMENT_HEAD, dept: "LOG", xp: 1520, points: 280, completed: 4, gender: Gender.MALE, designation: "Head of Logistics" },
    { name: "Fatima Sheikh", email: "fatima@verdantiq.demo", role: Role.EMPLOYEE, dept: "PROC", xp: 1360, points: 240, completed: 3, gender: Gender.FEMALE, designation: "Vendor Manager" },
    { name: "Arjun Kapoor", email: "arjun@verdantiq.demo", role: Role.EMPLOYEE, dept: "MFG", xp: 2110, points: 390, completed: 5, gender: Gender.MALE, designation: "Quality Engineer" },
    { name: "Leela Gupta", email: "leela@verdantiq.demo", role: Role.EMPLOYEE, dept: "CORP", xp: 990, points: 180, completed: 2, gender: Gender.FEMALE, designation: "Finance Associate" },
    { name: "Nikhil Rao", email: "nikhil@verdantiq.demo", role: Role.EMPLOYEE, dept: "SUS", xp: 1830, points: 340, completed: 4, gender: Gender.MALE, designation: "Field Coordinator" },
    { name: "Tara Singh", email: "tara@verdantiq.demo", role: Role.EMPLOYEE, dept: "LOG", xp: 1240, points: 210, completed: 3, gender: Gender.FEMALE, designation: "Route Planner" },
  ];
  const allSeedUsers = [...demoUsers, ...extraUsers];
  const users: { id: string; email: string; dept: string; role: Role }[] = [];
  for (const u of allSeedUsers) {
    const created = await prisma.user.create({
      data: {
        organizationId: org.id,
        departmentId: departments[u.dept],
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        totalXp: u.xp,
        availablePoints: u.points,
        completedChallengeCount: u.completed,
        lastLoginAt: daysAgo(1),
        profile: {
          create: {
            employeeCode: `GW-${1000 + users.length + 1}`,
            designation: u.designation,
            joiningDate: daysAgo(300 + users.length * 20),
            employmentType: EmploymentType.FULL_TIME,
            location: "Pune, IN",
            gender: u.gender,
            trainingCompletionPercentage: 60 + ((users.length * 7) % 40),
          },
        },
        notificationPreference: { create: { inAppEnabled: true, emailEnabled: false } },
      },
    });
    users.push({ id: created.id, email: u.email, dept: u.dept, role: u.role });
  }
  const byEmail = (e: string) => users.find((u) => u.email === e)!;

  // Assign department heads + employee counts.
  await prisma.department.update({ where: { id: departments.MFG }, data: { headUserId: byEmail("head@verdantiq.demo").id, employeeCount: 134 } });
  await prisma.department.update({ where: { id: departments.LOG }, data: { headUserId: byEmail("deepak@verdantiq.demo").id, employeeCount: 58, parentDepartmentId: departments.MFG } });
  await prisma.department.update({ where: { id: departments.PROC }, data: { employeeCount: 27 } });
  await prisma.department.update({ where: { id: departments.CORP }, data: { headUserId: byEmail("admin@verdantiq.demo").id, employeeCount: 41 } });
  await prisma.department.update({ where: { id: departments.SUS }, data: { headUserId: byEmail("manager@verdantiq.demo").id, employeeCount: 19 } });

  // ---- Categories ----
  const catData: { name: string; type: CategoryType }[] = [
    { name: "Environment", type: CategoryType.CSR_ACTIVITY },
    { name: "Community", type: CategoryType.CSR_ACTIVITY },
    { name: "Health", type: CategoryType.CSR_ACTIVITY },
    { name: "Energy", type: CategoryType.CHALLENGE },
    { name: "Waste", type: CategoryType.CHALLENGE },
    { name: "Mobility", type: CategoryType.CHALLENGE },
    { name: "Emissions", type: CategoryType.ESG },
    { name: "Compliance Training", type: CategoryType.TRAINING },
  ];
  const categories: Record<string, string> = {};
  for (const c of catData) {
    const cat = await prisma.category.create({
      data: { organizationId: org.id, name: c.name, type: c.type },
    });
    categories[`${c.type}:${c.name}`] = cat.id;
  }

  // ---- Emission factors ----
  const factorData = [
    { name: "Diesel (mobile combustion)", sourceType: "Fleet", activityUnit: "L", factorValue: 2.68, scope: EmissionScope.SCOPE_1, region: "IN" },
    { name: "Natural gas (stationary)", sourceType: "Manufacturing", activityUnit: "m³", factorValue: 2.02, scope: EmissionScope.SCOPE_1, region: "IN" },
    { name: "Grid electricity", sourceType: "Energy", activityUnit: "kWh", factorValue: 0.82, scope: EmissionScope.SCOPE_2, region: "IN" },
    { name: "Purchased steel", sourceType: "Purchase", activityUnit: "kg", factorValue: 1.85, scope: EmissionScope.SCOPE_3, region: "Global" },
    { name: "Corrugated packaging", sourceType: "Purchase", activityUnit: "kg", factorValue: 0.94, scope: EmissionScope.SCOPE_3, region: "Global" },
    { name: "Air freight", sourceType: "Fleet", activityUnit: "tonne-km", factorValue: 1.02, scope: EmissionScope.SCOPE_3, region: "Global" },
    { name: "Business travel (car)", sourceType: "Expense", activityUnit: "km", factorValue: 0.17, scope: EmissionScope.SCOPE_3, region: "IN" },
    { name: "Water supply", sourceType: "Expense", activityUnit: "m³", factorValue: 0.34, scope: EmissionScope.SCOPE_3, region: "IN" },
  ];
  const factors: { id: string; scope: EmissionScope; sourceType: string; activityUnit: string; factorValue: number; emissionUnit: string }[] = [];
  for (const f of factorData) {
    const created = await prisma.emissionFactor.create({
      data: {
        organizationId: org.id,
        name: f.name,
        sourceType: f.sourceType,
        activityUnit: f.activityUnit,
        factorValue: f.factorValue,
        emissionUnit: "kgCO2e",
        scope: f.scope,
        region: f.region,
        referenceYear: 2025,
        sourceReference: "DEFRA / IPCC 2025",
      },
    });
    factors.push({ id: created.id, scope: f.scope, sourceType: f.sourceType, activityUnit: f.activityUnit, factorValue: f.factorValue, emissionUnit: "kgCO2e" });
  }

  // ---- Product ESG profiles ----
  const products = [
    { sku: "GW-STEEL-01", productName: "Recycled Steel Beam", category: "Materials", embodiedCarbon: 320.5, recyclablePercentage: 92, renewableMaterialPercentage: 40, supplierEsgRating: "A" },
    { sku: "GW-PKG-02", productName: "Kraft Packaging Box", category: "Packaging", embodiedCarbon: 12.4, recyclablePercentage: 100, renewableMaterialPercentage: 85, supplierEsgRating: "A" },
    { sku: "GW-PUMP-03", productName: "Industrial Water Pump", category: "Equipment", embodiedCarbon: 540.0, recyclablePercentage: 60, renewableMaterialPercentage: 15, supplierEsgRating: "B" },
    { sku: "GW-PANEL-04", productName: "Solar Control Panel", category: "Electronics", embodiedCarbon: 180.2, recyclablePercentage: 70, renewableMaterialPercentage: 25, supplierEsgRating: "A" },
    { sku: "GW-LUBE-05", productName: "Bio Lubricant Drum", category: "Consumables", embodiedCarbon: 45.8, recyclablePercentage: 30, renewableMaterialPercentage: 78, supplierEsgRating: "B" },
  ];
  for (const p of products) {
    await prisma.productEsgProfile.create({ data: { organizationId: org.id, ...p } });
  }

  // ---- Environmental goals ----
  const goals = [
    { name: "Reduce Fleet Emissions", dept: "LOG", baseline: 620, target: 500, current: 528, unit: "t", status: GoalStatus.ACTIVE },
    { name: "Cut Packaging Waste", dept: "MFG", baseline: 160, target: 120, current: 127, unit: "t", status: GoalStatus.ON_TRACK },
    { name: "Reduce Office Energy Use", dept: "CORP", baseline: 110, target: 80, current: 80, unit: "t", status: GoalStatus.COMPLETED },
    { name: "Increase Recycled Material Usage", dept: "PROC", baseline: 30, target: 70, current: 58, unit: "%", status: GoalStatus.ACTIVE },
  ];
  for (const g of goals) {
    await prisma.environmentalGoal.create({
      data: {
        organizationId: org.id,
        departmentId: departments[g.dept],
        name: g.name,
        metric: g.unit === "%" ? "Recycled %" : "CO2e",
        baselineValue: g.baseline,
        targetValue: g.target,
        currentValue: g.current,
        unit: g.unit,
        startDate: daysAgo(300),
        dueDate: daysFromNow(160),
        status: g.status,
      },
    });
  }

  // ---- Business operations + carbon transactions (12 months) ----
  const adminId = byEmail("admin@verdantiq.demo").id;
  const opDepts = ["MFG", "LOG", "PROC", "CORP", "SUS"];
  // Seasonal multiplier gives an up-then-down emissions trend for the chart.
  const seasonal = [1.0, 1.05, 1.12, 1.18, 1.1, 0.98, 0.88, 0.95, 1.04, 1.0, 0.92, 0.85];
  let opCount = 0;
  for (let m = 11; m >= 0; m--) {
    const date = monthStart(m);
    const mult = seasonal[11 - m];
    // two operations per month, cycling through factors/departments
    for (let k = 0; k < 2; k++) {
      const factor = pick(factors, opCount);
      const dept = pick(opDepts, opCount);
      const baseQty = [850, 4200, 1500, 620, 300, 900, 1200, 500][opCount % 8];
      const quantity = Math.round(baseQty * mult);
      const opType: OperationType =
        factor.sourceType === "Fleet"
          ? OperationType.FLEET
          : factor.sourceType === "Manufacturing"
            ? OperationType.MANUFACTURING
            : factor.sourceType === "Purchase"
              ? OperationType.PURCHASE
              : OperationType.EXPENSE;
      const co2 = Math.round(quantity * factor.factorValue * 100) / 100;
      const op = await prisma.businessOperation.create({
        data: {
          organizationId: org.id,
          departmentId: departments[dept],
          operationType: opType,
          referenceNumber: `OP-${String(opCount + 1).padStart(4, "0")}`,
          description: `${factor.sourceType} activity`,
          operationDate: date,
          quantity,
          unit: factor.activityUnit,
          amount: Math.round(quantity * 3.2),
          emissionFactorId: factor.id,
          createdById: adminId,
        },
      });
      await prisma.carbonTransaction.create({
        data: {
          organizationId: org.id,
          departmentId: departments[dept],
          businessOperationId: op.id,
          emissionFactorId: factor.id,
          transactionDate: date,
          sourceType: factor.sourceType,
          quantity,
          factorValue: factor.factorValue,
          co2eKg: co2,
          scope: factor.scope,
          autoGenerated: true,
          calculationDescription: `${quantity} ${factor.activityUnit} × ${factor.factorValue} = ${co2} kgCO₂e`,
          createdById: adminId,
        },
      });
      opCount++;
    }
  }
  // A couple of manual extra operations to exceed 25.
  for (let i = 0; i < 3; i++) {
    const factor = pick(factors, i + 3);
    await prisma.businessOperation.create({
      data: {
        organizationId: org.id,
        departmentId: departments[pick(opDepts, i)],
        operationType: OperationType.EXPENSE,
        referenceNumber: `OP-EXTRA-${i + 1}`,
        operationDate: daysAgo(20 + i * 5),
        quantity: 400 + i * 50,
        unit: factor.activityUnit,
        amount: 1500,
        emissionFactorId: factor.id,
        createdById: adminId,
      },
    });
  }
  console.log(`  • ${opCount + 3} business operations + carbon transactions`);

  // ---- CSR activities + participations ----
  const csrData = [
    { title: "Tree Plantation Drive", cat: "Environment", points: 50, capacity: 40, evidence: true, dept: "SUS" },
    { title: "Blood Donation Camp", cat: "Health", points: 40, capacity: 30, evidence: true, dept: "CORP" },
    { title: "Beach Cleanup", cat: "Environment", points: 45, capacity: 50, evidence: false, dept: "SUS" },
    { title: "ESG Awareness Workshop", cat: "Community", points: 30, capacity: 60, evidence: false, dept: "SUS" },
  ];
  const csrActivities: { id: string; points: number; evidence: boolean }[] = [];
  for (const a of csrData) {
    const act = await prisma.csrActivity.create({
      data: {
        organizationId: org.id,
        departmentId: departments[a.dept],
        categoryId: categories[`CSR_ACTIVITY:${a.cat}`],
        title: a.title,
        description: `${a.title} organised by GreenWorks CSR team.`,
        location: "Pune, IN",
        activityDate: daysFromNow(14),
        registrationDeadline: daysFromNow(10),
        capacity: a.capacity,
        points: a.points,
        evidenceRequired: a.evidence,
        createdById: byEmail("manager@verdantiq.demo").id,
      },
    });
    csrActivities.push({ id: act.id, points: a.points, evidence: a.evidence });
  }
  // Participations: mix of approved / pending across employees.
  const employees = users.filter((u) => u.role === Role.EMPLOYEE || u.role === Role.DEPARTMENT_HEAD);
  let partIdx = 0;
  for (const act of csrActivities) {
    for (let i = 0; i < 6; i++) {
      const emp = pick(employees, partIdx + i);
      const status =
        i % 2 === 0 ? ApprovalStatus.PENDING : ApprovalStatus.APPROVED;
      try {
        await prisma.csrParticipation.create({
          data: {
            activityId: act.id,
            employeeId: emp.id,
            approvalStatus: status,
            proofFileUrl: act.evidence ? "/api/files/proofs/sample.pdf" : null,
            proofComment: status === ApprovalStatus.APPROVED ? "Completed as evidenced." : null,
            pointsEarned: status === ApprovalStatus.APPROVED ? act.points : 0,
            completionDate: status === ApprovalStatus.APPROVED ? daysAgo(3) : null,
            reviewedById: status === ApprovalStatus.APPROVED ? byEmail("manager@verdantiq.demo").id : null,
          },
        });
      } catch {
        /* duplicate emp/activity — skip */
      }
      partIdx++;
    }
  }

  // ---- Trainings + completions ----
  const trainingData = [
    { title: "Anti-Bribery & Corruption", dept: "CORP" },
    { title: "Workplace Safety & MSDS", dept: "MFG" },
    { title: "Data Privacy Essentials", dept: "CORP" },
  ];
  const trainings: string[] = [];
  for (const t of trainingData) {
    const tr = await prisma.training.create({
      data: {
        organizationId: org.id,
        departmentId: departments[t.dept],
        title: t.title,
        description: `${t.title} mandatory training module.`,
        dueDate: daysFromNow(30),
      },
    });
    trainings.push(tr.id);
  }
  let tIdx = 0;
  for (const trId of trainings) {
    for (const emp of employees) {
      const done = tIdx % 3 !== 0;
      await prisma.trainingCompletion.create({
        data: {
          trainingId: trId,
          employeeId: emp.id,
          completionPercentage: done ? 100 : 45,
          status: done ? TrainingCompletionStatus.COMPLETED : TrainingCompletionStatus.IN_PROGRESS,
          completedAt: done ? daysAgo(10) : null,
        },
      });
      tIdx++;
    }
  }

  // ---- Policies + acknowledgements ----
  const policyData = [
    { title: "Anti-Corruption Policy", code: "POL-AC", dept: "CORP" },
    { title: "Environmental Management Policy", code: "POL-ENV", dept: "SUS" },
    { title: "Health & Safety Policy", code: "POL-HS", dept: "MFG" },
    { title: "Supplier Code of Conduct", code: "POL-SUP", dept: "PROC" },
  ];
  const policies: string[] = [];
  for (const p of policyData) {
    const pol = await prisma.esgPolicy.create({
      data: {
        organizationId: org.id,
        departmentId: departments[p.dept],
        title: p.title,
        code: p.code,
        version: "1.0",
        description: `${p.title} — all employees must review and acknowledge.`,
        effectiveDate: daysAgo(60),
        acknowledgementDueDate: daysFromNow(15),
        acknowledgementRequired: true,
        status: PolicyStatus.PUBLISHED,
        createdById: adminId,
      },
    });
    policies.push(pol.id);
  }
  let aIdx = 0;
  for (const polId of policies) {
    for (const emp of employees) {
      const acked = aIdx % 8 !== 0;
      await prisma.policyAcknowledgement.create({
        data: {
          policyId: polId,
          employeeId: emp.id,
          acknowledgementStatus: acked ? AckStatus.ACKNOWLEDGED : AckStatus.PENDING,
          acknowledgedAt: acked ? daysAgo(5) : null,
        },
      });
      aIdx++;
    }
  }

  // ---- Audits + compliance issues ----
  const audit1 = await prisma.audit.create({
    data: {
      organizationId: org.id,
      departmentId: departments.MFG,
      title: "Q2 Waste Audit",
      description: "Quarterly waste-handling audit for the manufacturing plant.",
      auditType: AuditType.INTERNAL,
      auditorId: byEmail("auditor@verdantiq.demo").id,
      auditDate: daysAgo(30),
      findingsSummary: "3 minor issues identified.",
      score: 86,
      status: AuditStatus.COMPLETED,
    },
  });
  const audit2 = await prisma.audit.create({
    data: {
      organizationId: org.id,
      departmentId: departments.PROC,
      title: "Vendor Compliance Check",
      description: "Review of vendor ESG disclosures.",
      auditType: AuditType.VENDOR,
      auditorId: byEmail("auditor@verdantiq.demo").id,
      auditDate: daysAgo(11),
      findingsSummary: "1 open issue pending vendor response.",
      score: 78,
      status: AuditStatus.UNDER_REVIEW,
    },
  });
  await prisma.audit.create({
    data: {
      organizationId: org.id,
      departmentId: departments.SUS,
      title: "Energy Efficiency Review",
      auditType: AuditType.INTERNAL,
      auditorId: byEmail("auditor@verdantiq.demo").id,
      auditDate: daysAgo(4),
      score: 91,
      status: AuditStatus.COMPLETED,
      findingsSummary: "Strong performance; no major findings.",
    },
  });

  const complianceData = [
    { title: "Missing MSDS sheets", severity: Severity.HIGH, dept: "MFG", audit: audit1.id, status: ComplianceStatus.OPEN, owner: "head@verdantiq.demo", due: daysAgo(4) },
    { title: "Late vendor ESG disclosure", severity: Severity.MEDIUM, dept: "PROC", audit: audit2.id, status: ComplianceStatus.RESOLVED, owner: "rohit@verdantiq.demo", due: daysAgo(20) },
    { title: "Unlabelled chemical storage", severity: Severity.CRITICAL, dept: "MFG", audit: audit1.id, status: ComplianceStatus.IN_PROGRESS, owner: "head@verdantiq.demo", due: daysAgo(2) },
    { title: "Incomplete waste manifest", severity: Severity.LOW, dept: "LOG", audit: null, status: ComplianceStatus.RESOLVED, owner: "deepak@verdantiq.demo", due: daysFromNow(12) },
    { title: "Overdue safety inspection", severity: Severity.HIGH, dept: "MFG", audit: audit1.id, status: ComplianceStatus.OPEN, owner: "head@verdantiq.demo", due: daysAgo(9) },
  ];
  for (const c of complianceData) {
    const overdue =
      !!c.due &&
      c.due.getTime() < Date.now() &&
      (c.status === ComplianceStatus.OPEN || c.status === ComplianceStatus.IN_PROGRESS);
    await prisma.complianceIssue.create({
      data: {
        organizationId: org.id,
        auditId: c.audit,
        departmentId: departments[c.dept],
        title: c.title,
        description: `${c.title} raised during audit review.`,
        severity: c.severity,
        ownerId: byEmail(c.owner).id,
        dueDate: c.due,
        status: c.status,
        isOverdue: overdue,
        resolvedAt: c.status === ComplianceStatus.RESOLVED ? daysAgo(6) : null,
        resolutionNotes: c.status === ComplianceStatus.RESOLVED ? "Vendor submitted disclosure." : null,
      },
    });
  }

  // ---- Challenges (different lifecycle states) + participations ----
  const challengeData = [
    { title: "Sustainability Sprint", cat: "Energy", xp: 200, diff: Difficulty.HARD, status: ChallengeStatus.ACTIVE, evidence: true },
    { title: "Recycle Challenge", cat: "Waste", xp: 80, diff: Difficulty.EASY, status: ChallengeStatus.ACTIVE, evidence: true },
    { title: "Commute Green Week", cat: "Mobility", xp: 120, diff: Difficulty.MEDIUM, status: ChallengeStatus.UNDER_REVIEW, evidence: true },
    { title: "Paperless Office Challenge", cat: "Waste", xp: 90, diff: Difficulty.EASY, status: ChallengeStatus.DRAFT, evidence: false },
  ];
  const challenges: { id: string; xp: number; status: ChallengeStatus; evidence: boolean }[] = [];
  for (const c of challengeData) {
    const ch = await prisma.challenge.create({
      data: {
        organizationId: org.id,
        departmentId: departments.SUS,
        categoryId: categories[`CHALLENGE:${c.cat}`],
        title: c.title,
        description: `${c.title} — earn ${c.xp} XP on completion.`,
        xp: c.xp,
        difficulty: c.diff,
        evidenceRequired: c.evidence,
        startDate: daysAgo(10),
        deadline: daysFromNow(12),
        status: c.status,
        createdById: byEmail("manager@verdantiq.demo").id,
      },
    });
    challenges.push({ id: ch.id, xp: c.xp, status: c.status, evidence: c.evidence });
  }
  let cIdx = 0;
  for (const ch of challenges) {
    if (ch.status === ChallengeStatus.DRAFT) continue;
    for (let i = 0; i < 5; i++) {
      const emp = pick(employees, cIdx + i + 2);
      const isReview = ch.status === ChallengeStatus.UNDER_REVIEW;
      const status = i % 3 === 0 ? ApprovalStatus.PENDING : ApprovalStatus.APPROVED;
      try {
        await prisma.challengeParticipation.create({
          data: {
            challengeId: ch.id,
            employeeId: emp.id,
            approvalStatus: isReview ? ApprovalStatus.PENDING : status,
            progressPercentage: status === ApprovalStatus.APPROVED && !isReview ? 100 : 60,
            proofFileUrl: ch.evidence ? "/api/files/proofs/sample.pdf" : null,
            xpAwarded: status === ApprovalStatus.APPROVED && !isReview ? ch.xp : 0,
            completedAt: status === ApprovalStatus.APPROVED && !isReview ? daysAgo(2) : null,
            reviewedById: status === ApprovalStatus.APPROVED && !isReview ? byEmail("manager@verdantiq.demo").id : null,
          },
        });
      } catch {
        /* duplicate — skip */
      }
      cIdx++;
    }
  }

  // ---- Badges + awards ----
  const badgeData = [
    { name: "Green Beginner", icon: "Sprout", metric: UnlockMetric.TOTAL_XP, threshold: 500, desc: "Earn your first 500 XP." },
    { name: "Carbon Saver", icon: "Leaf", metric: UnlockMetric.COMPLETED_CHALLENGES, threshold: 5, desc: "Complete 5 challenges." },
    { name: "Sustainability Champion", icon: "Trophy", metric: UnlockMetric.TOTAL_XP, threshold: 3000, desc: "Reach 3000 XP." },
    { name: "Policy Pro", icon: "ShieldCheck", metric: UnlockMetric.POLICY_ACKNOWLEDGEMENTS, threshold: 3, desc: "Acknowledge 3 policies." },
    { name: "CSR Hero", icon: "HeartHandshake", metric: UnlockMetric.CSR_PARTICIPATIONS, threshold: 3, desc: "Approved in 3 CSR activities." },
  ];
  const badges: { id: string; metric: UnlockMetric; threshold: number }[] = [];
  for (const b of badgeData) {
    const badge = await prisma.badge.create({
      data: {
        organizationId: org.id,
        name: b.name,
        description: b.desc,
        icon: b.icon,
        unlockMetric: b.metric,
        unlockThreshold: b.threshold,
      },
    });
    badges.push({ id: badge.id, metric: b.metric, threshold: b.threshold });
  }
  // Award XP-based badges to matching users.
  for (const u of users) {
    const full = await prisma.user.findUnique({ where: { id: u.id } });
    if (!full) continue;
    for (const b of badges) {
      let earned = false;
      if (b.metric === UnlockMetric.TOTAL_XP) earned = full.totalXp >= b.threshold;
      if (b.metric === UnlockMetric.COMPLETED_CHALLENGES) earned = full.completedChallengeCount >= b.threshold;
      if (earned) {
        try {
          await prisma.employeeBadge.create({ data: { employeeId: u.id, badgeId: b.id, awardReason: "Seed award" } });
        } catch {
          /* dup */
        }
      }
    }
  }

  // ---- Rewards + redemptions ----
  const rewardData = [
    { name: "Reusable Bottle", points: 150, stock: 40, desc: "GreenWorks branded steel bottle." },
    { name: "Eco Gift Voucher", points: 300, stock: 25, desc: "₹500 sustainable-store voucher." },
    { name: "Extra Volunteer Leave", points: 500, stock: 15, desc: "One paid day for volunteering." },
    { name: "Sustainable Lunch Voucher", points: 200, stock: 30, desc: "Lunch at a partner cafe." },
    { name: "Green Desk Kit", points: 350, stock: 20, desc: "Plant + recycled desk accessories." },
  ];
  const rewards: string[] = [];
  for (const r of rewardData) {
    const rw = await prisma.reward.create({
      data: { organizationId: org.id, name: r.name, description: r.desc, pointsRequired: r.points, stock: r.stock },
    });
    rewards.push(rw.id);
  }
  await prisma.rewardRedemption.create({
    data: { rewardId: rewards[0], employeeId: byEmail("employee@verdantiq.demo").id, pointsUsed: 150, status: RedemptionStatus.FULFILLED, processedAt: daysAgo(8), processedById: byEmail("manager@verdantiq.demo").id },
  });
  await prisma.rewardRedemption.create({
    data: { rewardId: rewards[3], employeeId: byEmail("karan@verdantiq.demo").id, pointsUsed: 200, status: RedemptionStatus.PENDING },
  });

  // ---- Department score history (last 3 months) ----
  const deptScoreSeed: Record<string, [number, number, number]> = {
    MFG: [80, 76, 90],
    LOG: [78, 70, 85],
    PROC: [83, 72, 84],
    CORP: [85, 78, 92],
    SUS: [88, 82, 94],
  };
  for (let m = 2; m >= 0; m--) {
    for (const [code, [e, s, g]] of Object.entries(deptScoreSeed)) {
      const drift = (2 - m) * 1.5;
      const env = e - 4 + drift;
      const soc = s - 3 + drift;
      const gov = g - 3 + drift;
      const total = Math.round((env * 0.4 + soc * 0.3 + gov * 0.3) * 100) / 100;
      await prisma.departmentScore.create({
        data: {
          organizationId: org.id,
          departmentId: departments[code],
          periodStart: monthStart(m + 1),
          periodEnd: monthStart(m),
          environmentalScore: Math.round(env * 100) / 100,
          socialScore: Math.round(soc * 100) / 100,
          governanceScore: Math.round(gov * 100) / 100,
          totalScore: total,
        },
      });
    }
  }

  // ---- A few seeded notifications for the demo bell ----
  const empDemo = byEmail("employee@verdantiq.demo").id;
  await prisma.notification.createMany({
    data: [
      { organizationId: org.id, userId: empDemo, type: NotificationType.CSR_APPROVED, title: "CSR participation approved", message: "Your participation in 'Tree Plantation Drive' was approved. You earned 50 points.", entityType: "CsrParticipation" },
      { organizationId: org.id, userId: empDemo, type: NotificationType.BADGE_UNLOCKED, title: "Badge unlocked: Sustainability Champion", message: "You reached 3000 XP.", entityType: "Badge" },
      { organizationId: org.id, userId: byEmail("manager@verdantiq.demo").id, type: NotificationType.COMPLIANCE_OVERDUE, title: "Overdue compliance issue", message: "'Overdue safety inspection' has passed its due date.", entityType: "ComplianceIssue", readAt: null },
    ],
  });

  console.log("✅ Seed complete.");
  console.log(`   Org: ${org.name} · ${allSeedUsers.length} users · ${factors.length} factors`);
  console.log("   Login with any demo account · password: Demo@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
