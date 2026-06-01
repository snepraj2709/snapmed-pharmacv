export type CaseClassification = "significant" | "non-significant" | "null";

export type FieldStatus = "unchanged" | "overridden" | "new";

export interface ExtractedField {
  value: unknown;
  confidence: number;
  source: string;
  status?: FieldStatus;
  previous_value?: unknown;
  not_in_followup?: boolean;
}

export interface CaseRecord {
  case_id: string;
  version: number;
  case_classification: CaseClassification;
  extracted_at: string;
  source_document: string;
  sections: Record<string, Record<string, ExtractedField>>;
  missing_fields: string[];
}

export interface FollowUpPayload {
  case_id: string;
  follow_up_number?: number;
  version?: number;
  case_classification?: CaseClassification;
  extracted_at: string;
  source_document: string;
  sections: Record<string, Record<string, ExtractedField>>;
  missing_fields?: string[];
}

export interface QueryCreateRequest {
  caseId: string;
  fieldPath: string;
  question: string;
}

export interface QueryRecord extends QueryCreateRequest {
  id: string;
  createdAt: string;
}

export interface CaseReviewData {
  case: CaseRecord;
  source: "api" | "fixture";
  fallbackReason?: string;
}
