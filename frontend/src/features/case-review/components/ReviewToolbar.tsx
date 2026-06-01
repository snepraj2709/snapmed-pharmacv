import { ArrowDownWideNarrow, ListFilter } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { SortMode } from "../domain";

interface ReviewToolbarProps {
  conflictsOnly: boolean;
  sortMode: SortMode;
  visibleCount: number;
  totalCount: number;
  onConflictsOnlyChange: (checked: boolean) => void;
  onSortModeChange: (sortMode: SortMode) => void;
}

export function ReviewToolbar({
  conflictsOnly,
  sortMode,
  visibleCount,
  totalCount,
  onConflictsOnlyChange,
  onSortModeChange,
}: ReviewToolbarProps) {
  return (
    <section className="flex flex-col gap-4 border-y bg-white/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <ListFilter className="h-4 w-4 text-brand-blue" />
        <span>
          Showing <strong className="text-foreground">{visibleCount}</strong> of{" "}
          <strong className="text-foreground">{totalCount}</strong> fields
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Checkbox
            id="conflicts-only"
            checked={conflictsOnly}
            onCheckedChange={(checked) => onConflictsOnlyChange(checked === true)}
          />
          <Label htmlFor="conflicts-only" className="text-sm">
            Conflicts only
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <ArrowDownWideNarrow className="h-4 w-4 text-brand-blue" />
          <Select value={sortMode} onValueChange={(value) => onSortModeChange(value as SortMode)}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="section">Section order</SelectItem>
              <SelectItem value="confidence-low-first">Confidence, low first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
