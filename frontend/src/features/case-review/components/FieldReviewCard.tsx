import { ArrowRight, FileSearch, MessageSquarePlus } from "lucide-react";
import type { KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatFieldValue, type FieldReviewItem } from "../domain";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { StatusBadge } from "./StatusBadge";

interface FieldReviewCardProps {
  item: FieldReviewItem;
  onRaiseQuery: (field: FieldReviewItem) => void;
}

export function FieldReviewCard({ item, onRaiseQuery }: FieldReviewCardProps) {
  const isConflict = item.field.status === "overridden";
  const currentValue = formatFieldValue(item.field.value);
  const previousValue = formatFieldValue(item.field.previous_value);

  return (
    <article
      tabIndex={0}
      data-field-card="true"
      onKeyDown={handleFieldCardKeyDown}
      className={cn(
        "grid min-w-0 gap-3 px-3 py-2.5 outline-none transition-colors focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[20fr_50fr_30fr] md:items-stretch",
        isConflict && "bg-[#0077B6]/[0.04]",
      )}
    >
      <div className="min-w-0">
        <h3 className="break-words text-sm font-semibold leading-5 text-foreground">{item.label}</h3>
      </div>

      <div className="min-w-0">
        {isConflict ? (
          <ConflictComparison currentValue={currentValue} previousValue={previousValue} />
        ) : (
          <InlineValue value={currentValue} />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2 self-stretch md:items-end md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
          <StatusBadge status={item.field.status} />
          <ConfidenceBadge confidence={item.field.confidence} />
          {isConflict ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-brand-blue/25 bg-white px-2.5 text-brand-blue hover:bg-accent hover:text-brand-navy"
              aria-label={`Raise query for ${item.label}`}
              onClick={() => onRaiseQuery(item)}
            >
              <MessageSquarePlus className="h-4 w-4" />
              Query
            </Button>
          ) : null}
        </div>
        <SourceReference source={item.field.source} />
      </div>
    </article>
  );
}

function SourceReference({ source }: { source: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-1 self-end text-xs text-muted-foreground">
      <FileSearch className="h-3.5 w-3.5 shrink-0 text-brand-blue" />
      <span className="truncate">{source}</span>
    </div>
  );
}

function ConflictComparison({
  currentValue,
  previousValue,
}: {
  currentValue: string;
  previousValue: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_1rem_minmax(0,1fr)] items-center gap-1.5">
      <InlineValue label="Current" value={currentValue} tone="current" />
      <div className="flex justify-center text-brand-blue" aria-hidden="true">
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
      <InlineValue label="Previous" value={previousValue} tone="previous" />
    </div>
  );
}

function InlineValue({
  label,
  value,
  tone = "default",
}: {
  label?: string;
  value: string;
  tone?: "current" | "previous" | "default";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-baseline gap-2 py-1",
        tone === "previous" && "text-muted-foreground",
      )}
    >
      {label ? (
        <span className="shrink-0 text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {label}
        </span>
      ) : null}
      <span
        className={cn(
          "min-w-0 break-words text-sm font-medium leading-5 text-foreground",
          tone === "previous" && "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function handleFieldCardKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
    return;
  }

  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-field-card="true"]'));
  const currentIndex = cards.indexOf(event.currentTarget);
  if (currentIndex === -1) {
    return;
  }

  const direction = event.key === "ArrowDown" ? 1 : -1;
  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), cards.length - 1);
  cards[nextIndex]?.focus();
  event.preventDefault();
}
