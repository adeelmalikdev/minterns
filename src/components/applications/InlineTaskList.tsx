import { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardList, Upload, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StudentTaskCard } from "@/components/tasks/StudentTaskCard";
import { TaskSubmissionDialog } from "@/components/tasks/TaskSubmissionDialog";
import { GeneralSubmissionDialog } from "@/components/applications/GeneralSubmissionDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TaskWithSubmission } from "@/hooks/useStudentTasks";

interface InlineTaskListProps {
  applicationId: string;
  opportunityId: string;
  applicationCreatedAt: string;
  companyName: string;
  opportunityTitle: string;
}

export function InlineTaskList({ 
  applicationId, 
  opportunityId, 
  applicationCreatedAt,
  companyName,
  opportunityTitle,
}: InlineTaskListProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithSubmission | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [generalDialogOpen, setGeneralDialogOpen] = useState(false);

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
        application: { id: applicationId, created_at: applicationCreatedAt },
        opportunity: null,
      })) as TaskWithSubmission[];
    },
    enabled: !!user?.id && isOpen,
  });

  // Fetch general submission (task_id is null)
  const { data: generalSubmission } = useQuery({
    queryKey: ["general-submission", applicationId],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("application_id", applicationId)
        .is("task_id", null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && isOpen,
  });

  const handleOpenSubmitDialog = (task: TaskWithSubmission) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  // Calculate progress
  const totalTasks = tasks?.length || 0;
  const approvedTasks = tasks?.filter(t => t.submission?.status === "approved").length || 0;
  const pendingTasks = tasks?.filter(t => t.submission?.status === "pending").length || 0;
  const needsRevisionTasks = tasks?.filter(t => t.submission?.status === "needs_revision").length || 0;
  const hasTasks = totalTasks > 0;

  const getProgressColor = () => {
    if (totalTasks === 0) return "text-muted-foreground";
    if (approvedTasks === totalTasks) return "text-success";
    if (needsRevisionTasks > 0) return "text-destructive";
    return "text-primary";
  };

  const getGeneralSubmissionStatus = () => {
    if (!generalSubmission) return null;
    if (generalSubmission.status === "approved") return { label: "Approved", color: "bg-success/10 text-success" };
    if (generalSubmission.status === "pending") return { label: "Pending Review", color: "bg-warning/10 text-warning" };
    if (generalSubmission.status === "needs_revision") return { label: "Needs Revision", color: "bg-destructive/10 text-destructive" };
    return null;
  };

  const generalStatus = getGeneralSubmissionStatus();

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="mt-4 pt-4 border-t">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4" />
                {hasTasks ? "Tasks" : "Work Submission"}
                {hasTasks && (
                  <span className={`text-xs ${getProgressColor()}`}>
                    ({approvedTasks}/{totalTasks} completed)
                  </span>
                )}
                {!hasTasks && generalStatus && (
                  <Badge className={generalStatus.color}>{generalStatus.label}</Badge>
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
            ) : hasTasks ? (
              // Show task cards when tasks exist
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
            ) : (
              // Show general submission UI when no tasks
              <div className="text-center py-6 border rounded-lg bg-muted/30">
                {generalSubmission ? (
                  <div className="space-y-3">
                    <CheckCircle className="h-8 w-8 mx-auto text-success" />
                    <div>
                      <p className="font-medium text-foreground">Work Submitted</p>
                      <p className="text-sm text-muted-foreground">
                        {generalSubmission.status === "pending" && "Your submission is under review"}
                        {generalSubmission.status === "approved" && "Your work has been approved!"}
                        {generalSubmission.status === "needs_revision" && "Please revise and resubmit"}
                      </p>
                    </div>
                    {generalSubmission.submission_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={generalSubmission.submission_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Submission
                        </a>
                      </Button>
                    )}
                    {generalSubmission.status === "needs_revision" && (
                      <Button size="sm" onClick={() => setGeneralDialogOpen(true)}>
                        Edit & Resubmit
                      </Button>
                    )}
                    {generalSubmission.status !== "needs_revision" && (
                      <Button variant="ghost" size="sm" onClick={() => setGeneralDialogOpen(true)}>
                        View Details
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Submit Your Work</p>
                      <p className="text-sm text-muted-foreground">
                        Share your progress with a link or notes
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setGeneralDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Work
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      <TaskSubmissionDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={selectedTask}
      />

      <GeneralSubmissionDialog
        open={generalDialogOpen}
        onOpenChange={setGeneralDialogOpen}
        applicationId={applicationId}
        companyName={companyName}
        opportunityTitle={opportunityTitle}
        existingSubmission={generalSubmission}
      />
    </>
  );
}
