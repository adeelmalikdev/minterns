import { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardList, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StudentTaskCard } from "@/components/tasks/StudentTaskCard";
import { TaskSubmissionDialog } from "@/components/tasks/TaskSubmissionDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TaskWithSubmission } from "@/hooks/useStudentTasks";

interface InlineTaskListProps {
  applicationId: string;
  opportunityId: string;
  applicationCreatedAt: string;
}

export function InlineTaskList({ applicationId, opportunityId, applicationCreatedAt }: InlineTaskListProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch tasks for this specific opportunity
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["application-tasks", applicationId, opportunityId],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch tasks for this opportunity
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("order_index", { ascending: true });

      if (tasksError) throw tasksError;
      if (!tasksData?.length) return [];

      // Fetch submissions for these tasks
      const taskIds = tasksData.map(t => t.id);
      const { data: submissions, error: submissionsError } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("application_id", applicationId)
        .in("task_id", taskIds);

      if (submissionsError) throw submissionsError;

      // Map submissions to tasks
      const submissionMap = new Map(submissions?.map(s => [s.task_id, s]) || []);

      return tasksData.map(task => ({
        ...task,
        submission: submissionMap.get(task.id) || null,
        application: { created_at: applicationCreatedAt },
        opportunity: null,
      })) as TaskWithSubmission[];
    },
    enabled: !!user?.id && isOpen,
  });

  const handleOpenSubmitDialog = (task: TaskWithSubmission) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  // Calculate progress
  const totalTasks = tasks?.length || 0;
  const approvedTasks = tasks?.filter(t => t.submission?.status === "approved").length || 0;
  const pendingTasks = tasks?.filter(t => t.submission?.status === "pending").length || 0;
  const needsRevisionTasks = tasks?.filter(t => t.submission?.status === "needs_revision").length || 0;

  const getProgressColor = () => {
    if (totalTasks === 0) return "text-muted-foreground";
    if (approvedTasks === totalTasks) return "text-success";
    if (needsRevisionTasks > 0) return "text-destructive";
    return "text-primary";
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="mt-4 pt-4 border-t">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4" />
                Tasks
                {totalTasks > 0 && (
                  <span className={`text-xs ${getProgressColor()}`}>
                    ({approvedTasks}/{totalTasks} completed)
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                {needsRevisionTasks > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {needsRevisionTasks} needs revision
                  </Badge>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !tasks || tasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks assigned yet</p>
                <p className="text-xs">The recruiter will assign tasks soon</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {tasks.map((task, index) => (
                  <StudentTaskCard
                    key={task.id}
                    task={task}
                    taskNumber={index + 1}
                    applicationCreatedAt={applicationCreatedAt}
                    onSubmit={() => handleOpenSubmitDialog(task)}
                  />
                ))}
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      <TaskSubmissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
      />
    </>
  );
}
