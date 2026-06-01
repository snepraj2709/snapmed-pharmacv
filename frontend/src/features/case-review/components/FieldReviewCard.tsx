import { MessageSquarePlus } from "lucide-react";
import type { KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { formatFieldValue, type FieldReviewItem } from "../domain";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { StatusBadge } from "./StatusBadge";

interface FieldReviewCardProps {
  item: FieldReviewItem;
  onRaiseQuery: (field: FieldReviewItem) => void;
}

export function FieldReviewCard({ item, onRaiseQuery }: FieldReviewCardProps) {
  const isConflict = item.field.status === "overridden";

  return (
    <Card
      tabIndex={0}
      data-field-card="true"
      onKeyDown={handleFieldCardKeyDown}
      className="outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CardHeader className="gap-3 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{item.label}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{item.fieldPath}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={item.field.status} />
            <ConfidenceBadge confidence={item.field.confidence} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConflict ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ValuePanel label="New value" value={formatFieldValue(item.field.value)} primary />
            <ValuePanel label="Previous value" value={formatFieldValue(item.field.previous_value)} />
          </div>
        ) : (
          <ValuePanel label="Value" value={formatFieldValue(item.field.value)} primary />
        )}

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Source </span>
            <span className="font-medium text-foreground">{item.field.source}</span>
          </div>
          {isConflict ? (
            <Button size="sm" variant="outline" onClick={() => onRaiseQuery(item)}>
              <MessageSquarePlus className="h-4 w-4" />
              Raise Query
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ValuePanel({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className={primary ? "rounded-md border border-brand-blue/30 bg-accent p-3" : "rounded-md border bg-muted/40 p-3"}>
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-foreground">{value}</p>
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
