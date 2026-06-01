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

  return (
    <section aria-labelledby={headingId} className="rounded-lg border bg-white shadow-field">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
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
        <span className="text-sm text-muted-foreground">{fields.length} fields</span>
      </div>
      {isExpanded ? (
        <div id={contentId} className="grid gap-3 border-t p-4 lg:grid-cols-2">
          {fields.map((field) => (
            <FieldReviewCard key={field.fieldPath} item={field} onRaiseQuery={onRaiseQuery} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
