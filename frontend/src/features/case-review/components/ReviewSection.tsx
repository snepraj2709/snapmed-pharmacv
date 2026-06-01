import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { FieldReviewItem } from "../domain";
import { FieldReviewCard } from "./FieldReviewCard";

interface ReviewSectionProps {
  sectionKey: string;
  sectionLabel: string;
  fields: FieldReviewItem[];
  isCollapsible?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onRaiseQuery: (field: FieldReviewItem) => void;
}

export function ReviewSection({
  sectionKey,
  sectionLabel,
  fields,
  isCollapsible = true,
  isExpanded,
  onToggle,
  onRaiseQuery,
}: ReviewSectionProps) {
  const headingId = `${sectionKey}-section`;
  const contentId = `${sectionKey}-section-content`;
  const conflictCount = fields.filter((field) => field.field.status === "overridden").length;

  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-lg border bg-white shadow-field">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <h2 id={headingId} className="min-w-0">
          {isCollapsible ? (
            <Button
              type="button"
              variant="ghost"
              className="h-auto justify-start gap-2 px-0 py-1 text-lg font-semibold tracking-normal text-brand-navy hover:bg-transparent hover:text-brand-blue"
              aria-expanded={isExpanded}
              aria-controls={contentId}
              onClick={onToggle}
            >
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-brand-blue transition-transform",
                  isExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
              <span className="truncate">{sectionLabel}</span>
            </Button>
          ) : (
            <span className="block truncate py-1 text-lg font-semibold tracking-normal text-brand-navy">
              {sectionLabel}
            </span>
          )}
        </h2>
        <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          <span>{fields.length} fields</span>
          {conflictCount > 0 ? (
            <span className="rounded-md bg-brand-blue/10 px-2 py-1 text-xs font-medium text-brand-blue">
              {conflictCount} conflicts
            </span>
          ) : null}
        </div>
      </div>
      {isExpanded ? (
        <div id={contentId} className="flex flex-col divide-y divide-slate-200/80 border-t bg-white p-2">
          {fields.map((field) => (
            <FieldReviewCard key={field.fieldPath} item={field} onRaiseQuery={onRaiseQuery} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
