import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-env to-emerald-700 text-white shadow-sm ring-1 ring-white/10">
        <Leaf className="size-5" strokeWidth={2.2} />
      </span>
      {!collapsed && (
        <span className="text-base font-semibold tracking-tight text-white">
          Verdant<span className="text-env-light">IQ</span>
        </span>
      )}
    </div>
  );
}
