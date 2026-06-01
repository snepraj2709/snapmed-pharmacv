import baseCase from "../../../case_v1.json";
import followUpPayload from "../../../case_v2_followup_payload.json";

import type {
  CaseClassification,
  CaseRecord,
  ExtractedField,
  FieldStatus,
  FollowUpPayload,
} from "@/api/types";

const DEFAULT_FOLLOW_UP_CLASSIFICATION: CaseClassification = "null";

export function getFollowUpFixture(): FollowUpPayload {
  return followUpPayload as FollowUpPayload;
}

export function normalizeFollowUpPayload(payload: FollowUpPayload): CaseRecord {
  return {
    case_id: payload.case_id,
    version: payload.version ?? (payload.follow_up_number ?? 1) + 1,
    case_classification: payload.case_classification ?? DEFAULT_FOLLOW_UP_CLASSIFICATION,
    extracted_at: payload.extracted_at,
    source_document: payload.source_document,
    sections: payload.sections,
    missing_fields: payload.missing_fields ?? [],
  };
}

export function buildFallbackMergedCase(): CaseRecord {
  return mergeCaseRecords(normalizeBaseCase(), normalizeFollowUpPayload(getFollowUpFixture()));
}

function normalizeBaseCase(): CaseRecord {
  const rawCase = baseCase as unknown as Omit<CaseRecord, "missing_fields"> & {
    missing_fields?: string[];
  };

  return {
    ...rawCase,
    case_classification: rawCase.case_classification as CaseClassification,
    missing_fields: rawCase.missing_fields ?? [],
  };
}

function mergeCaseRecords(stored: CaseRecord, followUp: CaseRecord): CaseRecord {
  const sections: CaseRecord["sections"] = {};

  for (const sectionName of orderedUnion(Object.keys(stored.sections), Object.keys(followUp.sections))) {
    const storedFields = stored.sections[sectionName] ?? {};
    const followUpFields = followUp.sections[sectionName] ?? {};
    const mergedFields: Record<string, ExtractedField> = {};

    for (const fieldName of orderedUnion(Object.keys(storedFields), Object.keys(followUpFields))) {
      const storedField = storedFields[fieldName];
      const followUpField = followUpFields[fieldName];

      if (storedField && followUpField) {
        mergedFields[fieldName] =
          followUpField.value === storedField.value
            ? annotateField(followUpField, "unchanged")
            : annotateField(followUpField, "overridden", storedField.value);
      } else if (followUpField) {
        mergedFields[fieldName] = annotateField(followUpField, "new");
      } else if (storedField) {
        mergedFields[fieldName] = {
          ...annotateField(storedField, "unchanged"),
          not_in_followup: true,
        };
      }
    }

    sections[sectionName] = mergedFields;
  }

  return {
    case_id: stored.case_id,
    version: stored.version + 1,
    case_classification: followUp.case_classification,
    extracted_at: followUp.extracted_at,
    source_document: followUp.source_document,
    sections,
    missing_fields: followUp.missing_fields,
  };
}

function annotateField(
  field: ExtractedField,
  status: FieldStatus,
  previousValue?: unknown,
): ExtractedField {
  return {
    ...field,
    status,
    previous_value: previousValue,
  };
}

function orderedUnion(first: string[], second: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const item of [...first, ...second]) {
    if (!seen.has(item)) {
      ordered.push(item);
      seen.add(item);
    }
  }

  return ordered;
}
