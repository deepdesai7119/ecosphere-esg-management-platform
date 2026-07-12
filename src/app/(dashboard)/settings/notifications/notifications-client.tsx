"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api-client";

interface OrgToggles {
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
}
interface UserPrefs {
  complianceIssueNotifications: boolean;
  participationDecisionNotifications: boolean;
  policyReminderNotifications: boolean;
  badgeUnlockNotifications: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

function Row({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

export function NotificationsClient({
  org,
  prefs,
  canManageOrg,
}: {
  org: OrgToggles;
  prefs: UserPrefs;
  canManageOrg: boolean;
}) {
  const [orgState, setOrgState] = useState(org);
  const [prefState, setPrefState] = useState(prefs);

  async function saveOrg(next: OrgToggles) {
    setOrgState(next);
    try {
      await api.patch("/api/settings/esg-configuration", next);
      toast.success("Organisation settings updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    }
  }
  async function savePref(next: UserPrefs) {
    setPrefState(next);
    try {
      await api.patch("/api/settings/notification-preference", next);
      toast.success("Preferences updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Organisation notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="In-app notifications" hint="Show the notification bell for all users." checked={orgState.inAppNotificationsEnabled} disabled={!canManageOrg} onChange={(v) => saveOrg({ ...orgState, inAppNotificationsEnabled: v })} />
          <Row label="Email notifications" hint="Send emails when a Resend API key is configured." checked={orgState.emailNotificationsEnabled} disabled={!canManageOrg} onChange={(v) => saveOrg({ ...orgState, emailNotificationsEnabled: v })} />
          {!canManageOrg && <p className="pt-3 text-xs text-muted-foreground">Only administrators can change organisation-wide settings.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">My preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Compliance issues" checked={prefState.complianceIssueNotifications} onChange={(v) => savePref({ ...prefState, complianceIssueNotifications: v })} />
          <Row label="Approval decisions" checked={prefState.participationDecisionNotifications} onChange={(v) => savePref({ ...prefState, participationDecisionNotifications: v })} />
          <Row label="Policy reminders" checked={prefState.policyReminderNotifications} onChange={(v) => savePref({ ...prefState, policyReminderNotifications: v })} />
          <Row label="Badge unlocks" checked={prefState.badgeUnlockNotifications} onChange={(v) => savePref({ ...prefState, badgeUnlockNotifications: v })} />
          <Row label="Email me" checked={prefState.emailEnabled} onChange={(v) => savePref({ ...prefState, emailEnabled: v })} />
          <Row label="In-app for me" checked={prefState.inAppEnabled} onChange={(v) => savePref({ ...prefState, inAppEnabled: v })} />
        </CardContent>
      </Card>
    </div>
  );
}
