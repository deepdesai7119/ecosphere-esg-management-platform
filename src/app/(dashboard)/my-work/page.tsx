import Link from "next/link";
import {
  Award,
  Coins,
  FileText,
  HandHeart,
  Flag,
  ShieldAlert,
  Sparkles,
  Trophy,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ActionButton } from "@/components/shared/action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProofUploadAction } from "./proof-upload-action";
import { formatDate, formatNumber, toNumber } from "@/lib/format";

export const metadata = { title: "My Work" };
export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const user = await requireUser();

  const [me, pendingAcks, myCsr, myChallenges, ownedIssues, pendingCsrReview, pendingChallengeReview] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        include: { _count: { select: { badges: true } } },
      }),
      prisma.policyAcknowledgement.findMany({
        where: { employeeId: user.id, acknowledgementStatus: "PENDING" },
        include: { policy: { select: { id: true, title: true, code: true, acknowledgementDueDate: true } } },
      }),
      prisma.csrParticipation.findMany({
        where: { employeeId: user.id },
        include: { activity: { select: { title: true, evidenceRequired: true, points: true } } },
        orderBy: { joinedAt: "desc" },
        take: 10,
      }),
      prisma.challengeParticipation.findMany({
        where: { employeeId: user.id },
        include: { challenge: { select: { title: true, xp: true, evidenceRequired: true } } },
        orderBy: { joinedAt: "desc" },
        take: 10,
      }),
      prisma.complianceIssue.findMany({
        where: { ownerId: user.id, status: { in: ["OPEN", "IN_PROGRESS"] } },
        include: { department: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
      }),
      can(user.role, "csr.approve")
        ? prisma.csrParticipation.count({ where: { approvalStatus: "PENDING", activity: { organizationId: user.organizationId } } })
        : Promise.resolve(0),
      can(user.role, "challenge.approve")
        ? prisma.challengeParticipation.count({ where: { approvalStatus: "PENDING", challenge: { organizationId: user.organizationId } } })
        : Promise.resolve(0),
    ]);

  const isApprover = can(user.role, "csr.approve") || can(user.role, "challenge.approve");
  const canAcknowledge = can(user.role, "policy.acknowledge");

  return (
    <>
      <PageHeader
        title="My Work"
        description="Your tasks, submissions, points and rewards in one place."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total XP" value={formatNumber(me?.totalXp ?? 0, 0)} icon={Sparkles} iconClassName="bg-game/10 text-game" />
        <StatCard label="Available points" value={formatNumber(me?.availablePoints ?? 0, 0)} icon={Coins} iconClassName="bg-game/10 text-game" hint="Redeem for rewards" />
        <StatCard label="Challenges completed" value={me?.completedChallengeCount ?? 0} icon={Trophy} iconClassName="bg-game/10 text-game" />
        <StatCard label="Badges earned" value={me?._count.badges ?? 0} icon={Award} iconClassName="bg-game/10 text-game" />
      </div>

      {isApprover && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-social/10 text-social"><HandHeart className="size-4.5" /></span>
                <div>
                  <p className="text-sm font-medium">CSR approvals</p>
                  <p className="text-xs text-muted-foreground">{pendingCsrReview} pending review</p>
                </div>
              </div>
              <Link href="/social/participation" className="text-sm font-medium text-social hover:underline">Review →</Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-game/10 text-game"><Flag className="size-4.5" /></span>
                <div>
                  <p className="text-sm font-medium">Challenge approvals</p>
                  <p className="text-xs text-muted-foreground">{pendingChallengeReview} pending review</p>
                </div>
              </div>
              <Link href="/gamification/participation" className="text-sm font-medium text-game hover:underline">Review →</Link>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Policy acknowledgements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Policies to acknowledge</CardTitle>
            <FileText className="size-4 text-gov" />
          </CardHeader>
          <CardContent>
            {pendingAcks.length === 0 ? (
              <EmptyState icon={FileText} title="All caught up" description="No pending acknowledgements." className="border-0 py-6" />
            ) : (
              <ul className="space-y-2.5">
                {pendingAcks.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.policy.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.policy.code} · due {formatDate(a.policy.acknowledgementDueDate)}
                      </p>
                    </div>
                    {canAcknowledge && (
                      <ActionButton
                        endpoint={`/api/governance/policies/${a.policy.id}/acknowledge`}
                        label="Acknowledge"
                        variant="outline"
                        successMessage="Policy acknowledged."
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Owned compliance issues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Compliance assigned to me</CardTitle>
            <ShieldAlert className="size-4 text-gov" />
          </CardHeader>
          <CardContent>
            {ownedIssues.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="Nothing assigned" description="No open compliance issues owned by you." className="border-0 py-6" />
            ) : (
              <ul className="space-y-2.5">
                {ownedIssues.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.department?.name} · due {formatDate(i.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {i.isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      <StatusBadge status={i.severity} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* My CSR participations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My CSR activities</CardTitle>
            <HandHeart className="size-4 text-social" />
          </CardHeader>
          <CardContent>
            {myCsr.length === 0 ? (
              <EmptyState icon={HandHeart} title="No activities yet" description="Join a CSR activity to get started." action={<Link href="/social/activities" className="text-sm font-medium text-social hover:underline">Browse activities →</Link>} className="border-0 py-6" />
            ) : (
              <ul className="space-y-2.5">
                {myCsr.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.activity.title}</p>
                      <p className="text-xs text-muted-foreground">{p.activity.points} pts · {p.pointsEarned > 0 ? `${p.pointsEarned} earned` : "not yet awarded"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.approvalStatus} />
                      {p.approvalStatus === "PENDING" && p.activity.evidenceRequired && !p.proofFileUrl && (
                        <ProofUploadAction endpoint={`/api/social/participation/${p.id}/proof`} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* My challenges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My challenges</CardTitle>
            <Flag className="size-4 text-game" />
          </CardHeader>
          <CardContent>
            {myChallenges.length === 0 ? (
              <EmptyState icon={Flag} title="No challenges yet" description="Join a challenge to earn XP." action={<Link href="/gamification/challenges" className="text-sm font-medium text-game hover:underline">Browse challenges →</Link>} className="border-0 py-6" />
            ) : (
              <ul className="space-y-2.5">
                {myChallenges.map((p) => (
                  <li key={p.id} className="space-y-1.5 rounded-lg border p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{p.challenge.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{p.challenge.xp} XP</span>
                        <StatusBadge status={p.approvalStatus} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={toNumber(p.progressPercentage)} className="h-1.5" />
                      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{Math.round(toNumber(p.progressPercentage))}%</span>
                    </div>
                    {p.approvalStatus === "PENDING" && p.challenge.evidenceRequired && !p.proofFileUrl && (
                      <ProofUploadAction endpoint={`/api/gamification/participation/${p.id}/progress`} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
