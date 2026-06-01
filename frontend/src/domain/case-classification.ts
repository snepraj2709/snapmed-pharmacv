import type { CaseClassification } from "@/api/types";

export const CASE_CLASSIFICATION_OPTIONS = [
  { value: "significant", label: "Significant" },
  { value: "non-significant", label: "Non-significant" },
  { value: "null", label: "Null" },
] as const satisfies Array<{ value: CaseClassification; label: string }>;

export function normalizeCaseClassification(value: unknown): CaseClassification {
  if (typeof value !== "string") {
    return "null";
  }

  const normalized = value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");

  if (normalized === "significant" || normalized === "non-significant") {
    return normalized;
  }

  return "null";
}
