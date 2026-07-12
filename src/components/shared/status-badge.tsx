import { Badge } from "@/components/ui/badge";
import { statusVariant } from "@/lib/constants";
import { humanizeEnum } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string | null | undefined;
  label?: string;
  className?: string;
}) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant={statusVariant(status)} className={cn("capitalize", className)}>
      {label ?? humanizeEnum(status)}
    </Badge>
  );
}
