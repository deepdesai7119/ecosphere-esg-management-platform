import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

const DEMO_ACCOUNTS = [
  { role: "Org Admin", email: "admin@verdantiq.demo" },
  { role: "ESG Manager", email: "manager@verdantiq.demo" },
  { role: "Dept Head", email: "head@verdantiq.demo" },
  { role: "Employee", email: "employee@verdantiq.demo" },
  { role: "Auditor", email: "auditor@verdantiq.demo" },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-header p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-transparent to-emerald-600/10" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-env to-emerald-700 shadow-sm">
            <Leaf className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Verdant<span className="text-env-light">IQ</span>
          </span>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            ESG operations, engagement <br /> and compliance — unified.
          </h1>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-env-light" /> Automated carbon accounting &amp; ESG scoring
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-env-light" /> Governance, audits &amp; compliance tracking
            </li>
            <li className="flex items-center gap-2">
              <Leaf className="size-4 text-env-light" /> Gamified employee sustainability engagement
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© GreenWorks Industries · Demo environment</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-env to-emerald-700 text-white">
                <Leaf className="size-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Verdant<span className="text-env">IQ</span>
              </span>
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Sign in to your ESG workspace.
          </p>

          <LoginForm />

          <div className="mt-6 rounded-lg border bg-muted/40 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Demo accounts · password <code className="rounded bg-background px-1 py-0.5 font-mono">Demo@123</code>
            </p>
            <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email} className="flex items-center justify-between gap-2 rounded px-1">
                  <span className="text-muted-foreground">{a.role}</span>
                  <span className="font-mono text-[11px]">{a.email}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Continue to dashboard →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
