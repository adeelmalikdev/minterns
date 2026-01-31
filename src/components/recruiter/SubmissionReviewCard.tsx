import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, ChevronDown, ChevronUp, User, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SubmissionWithDetails } from "@/hooks/useRecruiterSubmissions";

interface SubmissionReviewCardProps {
  submission: SubmissionWithDetails;
  onReview: () => void;
}

const statusConfig = {
  pending: { label: "Pending Review", variant: "warning" as const },
  approved: { label: "Approved", variant: "success" as const },
  needs_revision: { label: "Needs Revision", variant: "destructive" as const },
};

export function SubmissionReviewCard({ submission, onReview }: SubmissionReviewCardProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const statusInfo = statusConfig[submission.status] || statusConfig.pending;
  const isPending = submission.status === "pending";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {submission.student.full_name || "Unknown Student"}
              </h3>
              <p className="text-sm text-muted-foreground">{submission.student.email}</p>
            </div>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {/* Task Info */}
        <div className="bg-muted/50 p-3 rounded-md mb-3">
          <p className="text-sm font-medium text-foreground">
            Task {submission.task.order_index + 1}: {submission.task.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {submission.opportunity.title} • {submission.opportunity.company_name}
          </p>
        </div>

        {/* Submission URL */}
        {submission.submission_url && (
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a
              href={submission.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate"
            >
              {submission.submission_url}
            </a>
          </div>
        )}

        {/* Student Notes (collapsible) */}
        {submission.notes && (
          <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen} className="mb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Student Notes
                </span>
                {isNotesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-sm text-foreground bg-muted/30 p-2 rounded mt-1">
                {submission.notes}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Previous Feedback */}
        {submission.feedback && submission.status !== "pending" && (
          <div className={`p-3 rounded-md text-sm mb-3 ${
            submission.status === "needs_revision" 
              ? "bg-destructive/10 border border-destructive/20" 
              : "bg-success/10 border border-success/20"
          }`}>
            <p className="font-medium text-foreground mb-1">Your Feedback:</p>
            <p className="text-muted-foreground">{submission.feedback}</p>
            {submission.reviewed_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Reviewed on {format(new Date(submission.reviewed_at), "MMM d, yyyy")}
              </p>
            )}
          </div>
        )}

        {/* Submitted Date */}
        <p className="text-xs text-muted-foreground mb-3">
          Submitted {format(new Date(submission.submitted_at), "MMM d, yyyy 'at' h:mm a")}
        </p>

        {/* Action Button */}
        <Button onClick={onReview} className="w-full" variant={isPending ? "default" : "outline"}>
          {isPending ? "Review Submission" : "View / Edit Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
