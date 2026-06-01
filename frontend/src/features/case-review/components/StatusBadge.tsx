import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { getStatusLabel } from "../domain";
import type { FieldStatus } from "@/api/types";

interface StatusBadgeProps {
  status?: FieldStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        status === "new" && "bg-brand-teal/10 text-brand-navy",
        status === "overridden" && "bg-brand-blue/10 text-brand-blue",
        status === "unchanged" && "bg-slate-100 text-slate-600",
      )}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
