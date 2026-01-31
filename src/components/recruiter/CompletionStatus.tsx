import { Check, Clock, AlertCircle, CircleDashed } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { CompletionStatus } from "@/hooks/useFeedback";

interface CompletionStatusProps {
  status: CompletionStatus | undefined;
  isLoading: boolean;
  onComplete: () => void;
  hasExistingFeedback: boolean;
  onViewFeedback: () => void;
}

const taskStatusConfig = {
  not_submitted: { icon: CircleDashed, label: "Not Submitted", color: "text-muted-foreground" },
  pending: { icon: Clock, label: "Under Review", color: "text-warning" },
  approved: { icon: Check, label: "Approved", color: "text-success" },
  needs_revision: { icon: AlertCircle, label: "Needs Revision", color: "text-destructive" },
};

export function CompletionStatusCard({
  status,
  isLoading,
  onComplete,
  hasExistingFeedback,
  onViewFeedback,
}: CompletionStatusProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  if (!status) return null;

  const { totalTasks, approvedTasks, isComplete, tasks } = status;
  const progressPercent = totalTasks > 0 ? (approvedTasks / totalTasks) * 100 : 100;

  // Already completed with feedback
  if (hasExistingFeedback) {
    return (
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Badge variant="success">Completed</Badge>
          <span className="text-sm text-muted-foreground">
            All {totalTasks} tasks approved
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onViewFeedback}>
          View Feedback
        </Button>
      </div>
    );
  }

  // Ready to complete
  if (isComplete && totalTasks > 0) {
    return (
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center gap-2">
          <span className="text-success text-lg">🎉</span>
          <span className="text-sm font-medium text-foreground">
            All tasks completed!
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={100} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground">
            {approvedTasks}/{totalTasks}
          </span>
        </div>
        <Button onClick={onComplete} className="w-full">
          Complete Internship & Rate Student
        </Button>
      </div>
    );
  }

  // No tasks defined
  if (totalTasks === 0) {
    return (
      <div className="space-y-3 pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          No tasks defined for this opportunity.
        </p>
        <Button onClick={onComplete} variant="outline" className="w-full">
          Complete & Rate Without Tasks
        </Button>
      </div>
    );
  }

  // In progress
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Task Progress</span>
          <span className="text-xs text-muted-foreground">
            {approvedTasks}/{totalTasks} approved
          </span>
        </div>
        
        <Progress value={progressPercent} className="h-2" />

        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span className="text-sm text-muted-foreground">
              {isOpen ? "Hide task details" : "Show task details"}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-2">
          {tasks.map((task) => {
            const config = taskStatusConfig[task.submissionStatus];
            const Icon = config.icon;
            return (
              <div
                key={task.id}
                className="flex items-center gap-2 text-sm py-1"
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className="flex-1 truncate">{task.title}</span>
                <span className={`text-xs ${config.color}`}>{config.label}</span>
              </div>
            );
          })}
        </CollapsibleContent>

        {status.pendingTasks > 0 && (
          <p className="text-xs text-muted-foreground">
            {status.pendingTasks} task{status.pendingTasks !== 1 ? "s" : ""} awaiting review
          </p>
        )}
      </div>
    </Collapsible>
  );
}
