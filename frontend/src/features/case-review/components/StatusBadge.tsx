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
        "bg-white",
        status === "new" && "border-brand-teal/40 text-brand-blue",
        status === "overridden" && "border-amber-200 text-amber-700",
        status === "unchanged" && "border-slate-200 text-slate-600",
      )}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
