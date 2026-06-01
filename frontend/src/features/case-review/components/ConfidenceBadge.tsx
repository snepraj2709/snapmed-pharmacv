import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { formatConfidence, getConfidenceLevel } from "../domain";

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence);

  return (
    <Badge
      variant="outline"
      className={cn("border-slate-200 bg-white text-brand-navy", level === "low" && "border-brand-blue/30")}
    >
      {formatConfidence(confidence)} {level}
    </Badge>
  );
}
