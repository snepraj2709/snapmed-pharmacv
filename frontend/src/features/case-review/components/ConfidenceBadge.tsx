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
      className={cn(
        "bg-white",
        level === "low" && "border-red-200 text-confidence-low",
        level === "medium" && "border-amber-200 text-confidence-medium",
        level === "high" && "border-emerald-200 text-confidence-high",
      )}
    >
      {formatConfidence(confidence)} {level}
    </Badge>
  );
}
