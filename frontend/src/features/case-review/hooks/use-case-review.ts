import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { caseReviewApi, getCaseReviewData } from "@/api/case-review-api";
import type { QueryCreateRequest } from "@/api/types";

export function useCaseReview(caseId: string) {
  return useQuery({
    queryKey: ["case-review", caseId],
    queryFn: () => getCaseReviewData(caseId),
  });
}

export function useRaiseQuery(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<QueryCreateRequest, "caseId">) =>
      caseReviewApi.createQuery({ ...payload, caseId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queries", caseId] });
    },
  });
}
