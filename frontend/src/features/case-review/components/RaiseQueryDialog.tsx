import { useEffect, useId, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { formatFieldValue, type FieldReviewItem } from "../domain";

interface RaiseQueryDialogProps {
  field: FieldReviewItem | null;
  open: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (question: string) => Promise<void>;
}

export function RaiseQueryDialog({
  field,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: RaiseQueryDialogProps) {
  const textareaId = useId();
  const [question, setQuestion] = useState("");

  useEffect(() => {
    if (open) {
      setQuestion("");
    }
  }, [open, field?.fieldPath]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise Query</DialogTitle>
          <DialogDescription>
            {field
              ? `${field.sectionLabel} / ${field.label}: ${formatFieldValue(field.field.value)}`
              : "Select a conflicting field to raise a reviewer query."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmedQuestion = question.trim();
            if (trimmedQuestion.length === 0) {
              return;
            }
            await onSubmit(trimmedQuestion);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={textareaId}>Question</Label>
            <Textarea
              id={textareaId}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask the case processor to verify the conflicting value."
              autoFocus
            />
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || question.trim().length === 0}>
              {isSubmitting ? "Submitting..." : "Submit Query"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
