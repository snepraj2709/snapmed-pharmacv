import type { CaseRecord, ExtractedField, FieldStatus } from "@/api/types";

export type ConfidenceLevel = "low" | "medium" | "high";
export type SortMode = "section" | "confidence-low-first";

export interface FieldReviewItem {
  sectionKey: string;
  sectionLabel: string;
  fieldKey: string;
  fieldPath: string;
  label: string;
  field: ExtractedField;
}

const SECTION_LABELS: Record<string, string> = {
  patient: "Patient",
  suspect_drug: "Suspect Drug",
  adverse_event: "Adverse Event",
  reporter: "Reporter",
};

const STATUS_LABELS: Record<FieldStatus, string> = {
  new: "New",
  overridden: "Overridden",
  unchanged: "Unchanged",
};

export function flattenCaseFields(caseRecord: CaseRecord): FieldReviewItem[] {
  return Object.entries(caseRecord.sections).flatMap(([sectionKey, fields]) =>
    Object.entries(fields).map(([fieldKey, field]) => ({
      sectionKey,
      sectionLabel: getSectionLabel(sectionKey),
      fieldKey,
      fieldPath: `${sectionKey}.${fieldKey}`,
      label: humanizeKey(fieldKey),
      field,
    })),
  );
}

export function groupFieldsBySection(fields: FieldReviewItem[]): Array<[string, FieldReviewItem[]]> {
  const grouped = new Map<string, FieldReviewItem[]>();

  for (const field of fields) {
    const existing = grouped.get(field.sectionKey) ?? [];
    existing.push(field);
    grouped.set(field.sectionKey, existing);
  }

  return Array.from(grouped.entries());
}

export function applyFieldControls(
  fields: FieldReviewItem[],
  controls: { conflictsOnly: boolean; sortMode: SortMode },
): FieldReviewItem[] {
  const filtered = controls.conflictsOnly
    ? fields.filter((item) => item.field.status === "overridden")
    : fields;

  if (controls.sortMode !== "confidence-low-first") {
    return filtered;
  }

  return [...filtered].sort((left, right) => left.field.confidence - right.field.confidence);
}

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence < 0.8) {
    return "low";
  }

  if (confidence <= 0.9) {
    return "medium";
  }

  return "high";
}

export function getStatusLabel(status: FieldStatus | undefined): string {
  return status ? STATUS_LABELS[status] : "Unreviewed";
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

export function getCaseStats(fields: FieldReviewItem[]) {
  return {
    total: fields.length,
    conflicts: fields.filter((item) => item.field.status === "overridden").length,
    lowConfidence: fields.filter((item) => getConfidenceLevel(item.field.confidence) === "low").length,
    newFields: fields.filter((item) => item.field.status === "new").length,
  };
}

function getSectionLabel(sectionKey: string): string {
  return SECTION_LABELS[sectionKey] ?? humanizeKey(sectionKey);
}

function humanizeKey(key: string): string {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
