import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface MissingFieldsBannerProps {
  missingFields: string[];
}

export function MissingFieldsBanner({ missingFields }: MissingFieldsBannerProps) {
  if (missingFields.length === 0) {
    return null;
  }

  return (
    <Alert variant="info">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AlertTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-brand-blue" />
            Missing AI-extracted fields
          </AlertTitle>
          <AlertDescription>
            These fields were reported by the follow-up extraction as unavailable.
          </AlertDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {missingFields.map((field) => (
            <Badge key={field} variant="outline" className="bg-white">
              {field}
            </Badge>
          ))}
        </div>
      </div>
    </Alert>
  );
}
