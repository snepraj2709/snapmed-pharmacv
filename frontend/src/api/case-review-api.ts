import { env } from "@/config/env";
import { buildFallbackMergedCase, normalizeFollowUpPayload } from "@/data/case-fixtures";

import { FetchHttpClient, type HttpClient } from "./http-client";
import type {
  CaseRecord,
  CaseReviewData,
  FollowUpPayload,
  QueryCreateRequest,
  QueryRecord,
} from "./types";

export interface CaseReviewApi {
  getCase(caseId: string): Promise<CaseRecord>;
  submitFollowUp(caseId: string, payload: FollowUpPayload): Promise<CaseRecord>;
  createQuery(payload: QueryCreateRequest): Promise<QueryRecord>;
  listQueries(caseId: string): Promise<QueryRecord[]>;
}

export class HttpCaseReviewApi implements CaseReviewApi {
  constructor(private readonly http: HttpClient) {}

  getCase(caseId: string): Promise<CaseRecord> {
    return this.http.get<CaseRecord>(`/cases/${encodeURIComponent(caseId)}`);
  }

  submitFollowUp(caseId: string, payload: FollowUpPayload): Promise<CaseRecord> {
    return this.http.post<CaseRecord, CaseRecord>(
      `/cases/${encodeURIComponent(caseId)}/follow-ups`,
      normalizeFollowUpPayload(payload),
    );
  }

  createQuery(payload: QueryCreateRequest): Promise<QueryRecord> {
    return this.http.post<QueryRecord, QueryCreateRequest>("/queries", payload);
  }

  listQueries(caseId: string): Promise<QueryRecord[]> {
    return this.http.get<QueryRecord[]>(`/queries?caseId=${encodeURIComponent(caseId)}`);
  }
}

export const caseReviewApi: CaseReviewApi = new HttpCaseReviewApi(
  new FetchHttpClient(env.apiBaseUrl),
);

export async function getCaseReviewData(caseId: string): Promise<CaseReviewData> {
  try {
    return {
      case: await caseReviewApi.getCase(caseId),
      source: "api",
    };
  } catch (error) {
    return {
      case: buildFallbackMergedCase(),
      source: "fixture",
      fallbackReason:
        error instanceof Error
          ? error.message
          : "The backend API was unavailable, so the local v2 follow-up fixture was used.",
    };
  }
}
