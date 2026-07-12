import Link from "next/link";
import { Leaf, Home, Users, Landmark, Trophy, FileBarChart, CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoBackButton } from "@/components/shared/go-back-button";

export const metadata = { title: "Page not found" };

const QUICK_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: Home, dot: "bg-foreground" },
  { label: "Environmental", href: "/environmental", icon: Leaf, dot: "bg-env" },
  { label: "Social", href: "/social", icon: Users, dot: "bg-social" },
  { label: "Governance", href: "/governance", icon: Landmark, dot: "bg-gov" },
  { label: "Gamification", href: "/gamification", icon: Trophy, dot: "bg-game" },
  { label: "Reports", href: "/reports", icon: FileBarChart, dot: "bg-foreground" },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center bg-background px-6 py-10">
      {/* Ambient brand glow — decorative only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-env/10 via-env/0 to-transparent"
      />

      {/* Wordmark */}
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-env to-emerald-700 text-white shadow-sm">
          <Leaf className="size-5" strokeWidth={2.2} />
        </span>
        <span className="text-lg font-semibold tracking-tight">
          Verdant<span className="text-env">IQ</span>
        </span>
      </div>

      {/* Main content, vertically centered in remaining space */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-2 select-none">
          <span
            aria-hidden
            className="text-[7rem] leading-none font-bold tracking-tight text-muted-foreground/15 sm:text-[9rem]"
          >
            404
          </span>
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-env/10 text-env ring-1 ring-env/20 sm:size-20">
              <CompassIcon className="size-8 sm:size-10" strokeWidth={1.75} />
            </span>
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          This page has left no trace.
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          The page you&rsquo;re looking for doesn&rsquo;t exist, may have moved, or the
          link is out of date. Let&rsquo;s get you back to solid ground.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 gap-2 px-6">
            <Link href="/dashboard">
              <Home className="size-4" />
              Back to dashboard
            </Link>
          </Button>
          <GoBackButton />
        </div>

        <div className="mt-10 w-full max-w-lg border-t pt-6">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Or jump to a module
          </p>
          <nav aria-label="Quick navigation" className="flex flex-wrap items-center justify-center gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden className={`size-1.5 rounded-full ${link.dot}`} />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        VerdantIQ · ESG Operations, Engagement &amp; Compliance
      </p>
    </div>
  );
}
