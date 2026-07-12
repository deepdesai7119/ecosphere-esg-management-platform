"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Config {
  environmentalWeight: number;
  socialWeight: number;
  governanceWeight: number;
  autoEmissionCalculationEnabled: boolean;
  evidenceRequiredForCsrApproval: boolean;
  badgeAutoAwardEnabled: boolean;
  complianceReminderEnabled: boolean;
  policyReminderEnabled: boolean;
}

const TOGGLES: { key: keyof Config; label: string; hint: string }[] = [
  { key: "autoEmissionCalculationEnabled", label: "Auto emission calculation", hint: "Generate carbon transactions automatically when operations are logged." },
  { key: "evidenceRequiredForCsrApproval", label: "Require evidence for CSR & challenge approval", hint: "Block approval unless proof is attached." },
  { key: "badgeAutoAwardEnabled", label: "Auto-award badges", hint: "Evaluate and grant badges on XP / challenge / CSR / policy milestones." },
  { key: "complianceReminderEnabled", label: "Compliance reminders", hint: "Notify owners and managers about overdue compliance issues." },
  { key: "policyReminderEnabled", label: "Policy reminders", hint: "Remind employees about pending policy acknowledgements." },
];

export function ConfigForm({ config, canManage }: { config: Config; canManage: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<Config>(config);
  const [saving, setSaving] = useState(false);

  const sum = form.environmentalWeight + form.socialWeight + form.governanceWeight;
  const weightsValid = sum === 100;

  function setWeight(key: keyof Config, value: string) {
    setForm((p) => ({ ...p, [key]: Number(value) || 0 }));
  }

  async function save() {
    if (!weightsValid) {
      toast.error("ESG weights must sum to exactly 100.");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/api/settings/esg-configuration", form);
      toast.success("Configuration saved.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">ESG scoring weights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["environmentalWeight", "socialWeight", "governanceWeight"] as const).map((k) => (
              <div key={k} className="space-y-1.5">
                <Label htmlFor={k} className="capitalize">{k.replace("Weight", "")} %</Label>
                <Input id={k} type="number" min={0} max={100} value={form[k]} disabled={!canManage} onChange={(e) => setWeight(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div className={cn("flex items-center gap-2 text-sm", weightsValid ? "text-muted-foreground" : "text-danger")}>
            {!weightsValid && <AlertTriangle className="size-4" />}
            Total: <span className="font-semibold tabular-nums">{sum}%</span>
            {!weightsValid && <span>· must equal 100%</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Automation & rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.hint}</p>
              </div>
              <Switch checked={Boolean(form[t.key])} disabled={!canManage} onCheckedChange={(c) => setForm((p) => ({ ...p, [t.key]: c }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || !weightsValid}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save configuration
          </Button>
        </div>
      )}
    </div>
  );
}
