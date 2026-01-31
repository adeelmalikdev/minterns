import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CompletionStatus {
  totalTasks: number;
  approvedTasks: number;
  pendingTasks: number;
  isComplete: boolean;
  tasks: Array<{
    id: string;
    title: string;
    order_index: number;
    submissionStatus: "not_submitted" | "pending" | "approved" | "needs_revision";
  }>;
}

export function useApplicationCompletionStatus(applicationId: string, opportunityId: string) {
  return useQuery({
    queryKey: ["application-completion", applicationId, opportunityId],
    queryFn: async (): Promise<CompletionStatus> => {
      // Get all tasks for the opportunity
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, order_index")
        .eq("opportunity_id", opportunityId)
        .order("order_index", { ascending: true });

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) {
        return {
          totalTasks: 0,
          approvedTasks: 0,
          pendingTasks: 0,
          isComplete: true, // No tasks means auto-complete eligible
          tasks: [],
        };
      }

      // Get submissions for this application
      const { data: submissions, error: subError } = await supabase
        .from("task_submissions")
        .select("task_id, status")
        .eq("application_id", applicationId);

      if (subError) throw subError;

      // Map task completion status
      const taskStatuses = tasks.map((task) => {
        const submission = submissions?.find((s) => s.task_id === task.id);
        return {
          id: task.id,
          title: task.title,
          order_index: task.order_index,
          submissionStatus: submission?.status || "not_submitted",
        };
      });

      const approvedCount = taskStatuses.filter((t) => t.submissionStatus === "approved").length;
      const pendingCount = taskStatuses.filter(
        (t) => t.submissionStatus === "pending" || t.submissionStatus === "needs_revision"
      ).length;

      return {
        totalTasks: tasks.length,
        approvedTasks: approvedCount,
        pendingTasks: pendingCount,
        isComplete: approvedCount === tasks.length && tasks.length > 0,
        tasks: taskStatuses as CompletionStatus["tasks"],
      };
    },
    enabled: !!applicationId && !!opportunityId,
  });
}

export function useFeedbackForApplication(applicationId: string) {
  return useQuery({
    queryKey: ["feedback", applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("application_id", applicationId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!applicationId,
  });
}

export function useSubmitFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      rating,
      skillsDemonstrated,
      comments,
    }: {
      applicationId: string;
      rating: number;
      skillsDemonstrated: string[];
      comments?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Insert feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from("feedback")
        .insert({
          application_id: applicationId,
          evaluator_id: user.id,
          rating,
          skills_demonstrated: skillsDemonstrated,
          comments: comments || null,
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // Update application status to completed
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "completed" })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      return feedback;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feedback", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-opportunity"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-stats"] });
      queryClient.invalidateQueries({ queryKey: ["application-completion"] });
    },
  });
}
