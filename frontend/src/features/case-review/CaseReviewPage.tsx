import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { CaseClassification } from "@/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { applyFieldControls, flattenCaseFields, getCaseStats, groupFieldsBySection } from "./domain";
import { CaseHeader } from "./components/CaseHeader";
import { CaseReviewSkeleton, EmptyCaseState } from "./components/StateViews";
import { MissingFieldsBanner } from "./components/MissingFieldsBanner";
import { RaiseQueryDialog } from "./components/RaiseQueryDialog";
import { ReviewSection } from "./components/ReviewSection";
import { ReviewToolbar } from "./components/ReviewToolbar";
import { useCaseReview, useRaiseQuery } from "./hooks/use-case-review";
import { useReviewControls } from "./hooks/use-review-controls";

interface CaseReviewPageProps {
  caseId: string;
}

export function CaseReviewPage({ caseId }: CaseReviewPageProps) {
  const caseReviewQuery = useCaseReview(caseId);
  const raiseQuery = useRaiseQuery(caseId);
  const controls = useReviewControls();
  const [classification, setClassification] = useState<CaseClassification>("null");

  const caseRecord = caseReviewQuery.data?.case;
  const fields = useMemo(() => (caseRecord ? flattenCaseFields(caseRecord) : []), [caseRecord]);
  const visibleFields = useMemo(
    () => applyFieldControls(fields, controls.state),
    [controls.state, fields],
  );
  const groupedFields = useMemo(() => groupFieldsBySection(visibleFields), [visibleFields]);
  const stats = useMemo(() => getCaseStats(fields), [fields]);

  useEffect(() => {
    if (caseRecord) {
      setClassification(caseRecord.case_classification);
    }
  }, [caseRecord]);

  if (caseReviewQuery.isLoading) {
    return <CaseReviewSkeleton />;
  }

  if (!caseRecord) {
    return <EmptyCaseState caseId={caseId} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <CaseHeader
        caseRecord={caseRecord}
        classification={classification}
        stats={stats}
        onClassificationChange={setClassification}
      />

      <main className="container flex flex-col gap-6 py-6">
        {caseReviewQuery.data?.source === "fixture" ? (
          <Alert variant="warning">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            <AlertTitle>Local follow-up fixture in use</AlertTitle>
            <AlertDescription>
              The backend case request did not complete. This view is using the merged local
              `case_v2_followup_payload.json` fixture so review work can continue.
              {caseReviewQuery.data.fallbackReason ? ` Reason: ${caseReviewQuery.data.fallbackReason}` : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <MissingFieldsBanner missingFields={caseRecord.missing_fields} />

        <ReviewToolbar
          conflictsOnly={controls.state.conflictsOnly}
          sortMode={controls.state.sortMode}
          visibleCount={visibleFields.length}
          totalCount={fields.length}
          onConflictsOnlyChange={controls.setConflictsOnly}
          onSortModeChange={controls.setSortMode}
        />

        {visibleFields.length === 0 ? (
          <EmptyCaseState caseId={caseId} filtered />
        ) : (
          <div className="flex flex-col gap-8">
            {groupedFields.map(([sectionKey, sectionFields]) => (
              <ReviewSection
                key={sectionKey}
                sectionKey={sectionKey}
                sectionLabel={sectionFields[0]?.sectionLabel ?? sectionKey}
                fields={sectionFields}
                onRaiseQuery={controls.openQuery}
              />
            ))}
          </div>
        )}
      </main>

      <RaiseQueryDialog
        field={controls.state.queryField}
        open={controls.state.queryField !== null}
        isSubmitting={raiseQuery.isPending}
        errorMessage={raiseQuery.error instanceof Error ? raiseQuery.error.message : undefined}
        onOpenChange={(open) => {
          if (!open) {
            controls.closeQuery();
          }
        }}
        onSubmit={async (question) => {
          const field = controls.state.queryField;
          if (!field) {
            return;
          }

          await raiseQuery.mutateAsync({
            fieldPath: field.fieldPath,
            question,
          });
          controls.closeQuery();
        }}
      />
    </div>
  );
}
