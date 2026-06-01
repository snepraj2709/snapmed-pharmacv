import type { FieldReviewItem } from "../domain";
import { FieldReviewCard } from "./FieldReviewCard";

interface ReviewSectionProps {
  sectionKey: string;
  sectionLabel: string;
  fields: FieldReviewItem[];
  onRaiseQuery: (field: FieldReviewItem) => void;
}

export function ReviewSection({ sectionKey, sectionLabel, fields, onRaiseQuery }: ReviewSectionProps) {
  const headingId = `${sectionKey}-section`;

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-semibold tracking-normal text-brand-navy">
          {sectionLabel}
        </h2>
        <span className="text-sm text-muted-foreground">{fields.length} fields</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {fields.map((field) => (
          <FieldReviewCard key={field.fieldPath} item={field} onRaiseQuery={onRaiseQuery} />
        ))}
      </div>
    </section>
  );
}
