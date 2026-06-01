import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export function CaseReviewSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-brand-navy">
        <div className="container py-6">
          <Skeleton className="h-7 w-48 bg-white/20" />
          <Skeleton className="mt-4 h-9 w-72 bg-white/20" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 bg-white/10" />
            ))}
          </div>
        </div>
      </div>
      <main className="container space-y-4 py-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-16" />
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-56" />
          ))}
        </div>
      </main>
    </div>
  );
}

export function EmptyCaseState({ caseId, filtered = false }: { caseId: string; filtered?: boolean }) {
  return (
    <section className="container py-6">
      <Alert>
        <AlertCircle className="mr-2 inline h-4 w-4" />
        <AlertTitle>{filtered ? "No fields match the current filters" : "Case data unavailable"}</AlertTitle>
        <AlertDescription>
          {filtered
            ? "Adjust the filter controls to return to the full case review."
            : `No reviewable fields were available for case ${caseId}.`}
        </AlertDescription>
      </Alert>
    </section>
  );
}
