import { FileText } from "lucide-react";

import type { CaseClassification, CaseRecord } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CASE_CLASSIFICATION_OPTIONS } from "@/domain/case-classification";

interface CaseHeaderProps {
  caseRecord: CaseRecord;
  classification: CaseClassification;
  stats: {
    total: number;
    conflicts: number;
    lowConfidence: number;
    newFields: number;
  };
  onClassificationChange: (value: CaseClassification) => void;
}

export function CaseHeader({
  caseRecord,
  classification,
  stats,
  onClassificationChange,
}: CaseHeaderProps) {
  return (
    <header className="bg-brand-navy text-white">
      <div className="container flex flex-col gap-5 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-white">Case Review</Badge>
              <Badge className="border-brand-teal/40 bg-brand-teal/15 text-cyan-100">
                Version {caseRecord.version}
              </Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">{caseRecord.case_id}</h1>
              <p className="mt-2 flex max-w-3xl items-center gap-2 text-sm text-slate-200">
                <FileText className="h-4 w-4 shrink-0 text-brand-teal" />
                <span className="truncate">{caseRecord.source_document}</span>
              </p>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <Label htmlFor="case-classification" className="text-slate-200">
              Case Classification
            </Label>
            <Select
              value={classification === "null" ? "" : classification}
              onValueChange={(value) => onClassificationChange(value as CaseClassification)}
            >
              <SelectTrigger id="case-classification" className="border-white/20 bg-white text-brand-navy">
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                {CASE_CLASSIFICATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="bg-white/15" />

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HeaderMetric label="Fields" value={stats.total} />
          <HeaderMetric label="Conflicts" value={stats.conflicts} />
          <HeaderMetric label="Low Confidence" value={stats.lowConfidence} />
          <HeaderMetric label="New Fields" value={stats.newFields} />
        </dl>
      </div>
    </header>
  );
}

function HeaderMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <dt className="text-xs uppercase tracking-normal text-slate-300">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
    </div>
  );
}
