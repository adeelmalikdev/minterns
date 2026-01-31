import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, ExternalLink, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TaskWithSubmission } from "@/hooks/useStudentTasks";

interface StudentTaskCardProps {
  task: TaskWithSubmission;
  taskNumber: number;
  applicationCreatedAt: string;
  onSubmit: () => void;
}

const statusConfig = {
  not_started: { label: "Not Started", variant: "secondary" as const },
  pending: { label: "Under Review", variant: "warning" as const },
  approved: { label: "Approved", variant: "success" as const },
  needs_revision: { label: "Needs Revision", variant: "destructive" as const },
};

export function StudentTaskCard({ task, taskNumber, applicationCreatedAt, onSubmit }: StudentTaskCardProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const status = task.submission?.status || "not_started";
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;

  // Calculate due date
  let dueDate: Date | null = null;
  let isUrgent = false;
  let isOverdue = false;

  if (task.due_days && applicationCreatedAt) {
    dueDate = new Date(applicationCreatedAt);
    dueDate.setDate(dueDate.getDate() + task.due_days);
    const now = new Date();
    isOverdue = dueDate < now;
    isUrgent = !isOverdue && dueDate.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;
  }

  const canSubmit = status === "not_started" || status === "needs_revision";
  const hasSubmission = !!task.submission;
  const hasFeedback = task.submission?.feedback;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
              {taskNumber}
            </span>
            <div>
              <h3 className="font-semibold text-foreground">{task.title}</h3>
              <p className="text-sm text-muted-foreground">{task.opportunity?.company_name}</p>
            </div>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {/* Description (collapsible if long) */}
        {task.description && (
          <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
            <div className="mb-3">
              <p className={`text-sm text-muted-foreground ${!isDescriptionOpen ? "line-clamp-2" : ""}`}>
                {task.description}
              </p>
              {task.description.length > 150 && (
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                    {isDescriptionOpen ? (
                      <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
                    ) : (
                      <>Show more <ChevronDown className="h-3 w-3 ml-1" /></>
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
            <CollapsibleContent />
          </Collapsible>
        )}

        {/* Due Date */}
        {dueDate && (
          <div className={`flex items-center gap-2 text-sm mb-3 ${
            isOverdue ? "text-destructive" : isUrgent ? "text-warning" : "text-muted-foreground"
          }`}>
            <Clock className="h-4 w-4" />
            <span>
              {isOverdue ? "Overdue: " : "Due: "}
              {format(dueDate, "MMM d, yyyy")} 
              {!isOverdue && ` (${formatDistanceToNow(dueDate, { addSuffix: true })})`}
            </span>
          </div>
        )}

        {!task.due_days && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="h-4 w-4" />
            <span>No deadline</span>
          </div>
        )}

        {/* Existing Submission Info */}
        {hasSubmission && task.submission?.submission_url && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <ExternalLink className="h-4 w-4" />
            <a
              href={task.submission.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              {task.submission.submission_url}
            </a>
          </div>
        )}

        {/* Recruiter Feedback (collapsible) */}
        {hasFeedback && (
          <Collapsible open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between mb-3">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Recruiter Feedback
                </span>
                {isFeedbackOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={`p-3 rounded-md text-sm mb-3 ${
                status === "needs_revision" 
                  ? "bg-destructive/10 border border-destructive/20" 
                  : "bg-success/10 border border-success/20"
              }`}>
                <p className="text-foreground">{task.submission?.feedback}</p>
                {task.submission?.reviewed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Reviewed on {format(new Date(task.submission.reviewed_at), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Button */}
        <Button 
          onClick={onSubmit} 
          className="w-full"
          variant={canSubmit ? "default" : "outline"}
        >
          {status === "not_started" && "Submit Work"}
          {status === "pending" && "View Submission"}
          {status === "approved" && "View Submission"}
          {status === "needs_revision" && "Revise & Resubmit"}
        </Button>
      </CardContent>
    </Card>
  );
}
