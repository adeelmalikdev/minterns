import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

export interface SubmissionWithDetails {
  id: string;
  task_id: string;
  student_id: string;
  application_id: string;
  submission_url: string | null;
  notes: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  task: {
    id: string;
    title: string;
    description: string | null;
    order_index: number;
    opportunity_id: string;
  };
  opportunity: {
    id: string;
    title: string;
    company_name: string;
  };
  student: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export function useRecruiterSubmissions(opportunityId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recruiter-submissions", user?.id, opportunityId],
    queryFn: async (): Promise<SubmissionWithDetails[]> => {
      if (!user?.id) throw new Error("User not authenticated");

      // First, get recruiter's opportunities
      let opportunitiesQuery = supabase
        .from("opportunities")
        .select("id")
        .eq("recruiter_id", user.id);

      if (opportunityId) {
        opportunitiesQuery = opportunitiesQuery.eq("id", opportunityId);
      }

      const { data: opportunities, error: oppError } = await opportunitiesQuery;
      if (oppError) throw oppError;
      if (!opportunities || opportunities.length === 0) return [];

      const opportunityIds = opportunities.map((o) => o.id);

      // Get tasks for these opportunities
      const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("id, title, description, order_index, opportunity_id")
        .in("opportunity_id", opportunityIds);

      if (taskError) throw taskError;
      if (!tasks || tasks.length === 0) return [];

      const taskIds = tasks.map((t) => t.id);

      // Get submissions for these tasks
      const { data: submissions, error: subError } = await supabase
        .from("task_submissions")
        .select("*")
        .in("task_id", taskIds)
        .order("submitted_at", { ascending: false });

      if (subError) throw subError;
      if (!submissions || submissions.length === 0) return [];

      // Get opportunity details
      const { data: oppDetails, error: oppDetailsError } = await supabase
        .from("opportunities")
        .select("id, title, company_name")
        .in("id", opportunityIds);

      if (oppDetailsError) throw oppDetailsError;

      // Get student profiles
      const studentIds = [...new Set(submissions.map((s) => s.student_id))];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", studentIds);

      if (profileError) throw profileError;

      // Map everything together
      return submissions.map((submission) => {
        const task = tasks.find((t) => t.id === submission.task_id)!;
        const opportunity = oppDetails?.find((o) => o.id === task.opportunity_id);
        const student = profiles?.find((p) => p.user_id === submission.student_id);

        return {
          id: submission.id,
          task_id: submission.task_id,
          student_id: submission.student_id,
          application_id: submission.application_id,
          submission_url: submission.submission_url,
          notes: submission.notes,
          status: submission.status,
          feedback: submission.feedback,
          submitted_at: submission.submitted_at,
          reviewed_at: submission.reviewed_at,
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            order_index: task.order_index,
            opportunity_id: task.opportunity_id,
          },
          opportunity: {
            id: opportunity?.id || "",
            title: opportunity?.title || "Unknown",
            company_name: opportunity?.company_name || "Unknown",
          },
          student: {
            id: student?.user_id || submission.student_id,
            full_name: student?.full_name || null,
            email: student?.email || "Unknown",
          },
        };
      });
    },
    enabled: !!user?.id,
  });
}

export function usePendingSubmissionsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pending-submissions-count", user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      // Get recruiter's opportunities
      const { data: opportunities } = await supabase
        .from("opportunities")
        .select("id")
        .eq("recruiter_id", user.id);

      if (!opportunities || opportunities.length === 0) return 0;

      // Get tasks for these opportunities
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id")
        .in("opportunity_id", opportunities.map((o) => o.id));

      if (!tasks || tasks.length === 0) return 0;

      // Count pending submissions
      const { count, error } = await supabase
        .from("task_submissions")
        .select("*", { count: "exact", head: true })
        .in("task_id", tasks.map((t) => t.id))
        .eq("status", "pending");

      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
  });
}

export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      status,
      feedback,
    }: {
      submissionId: string;
      status: "approved" | "needs_revision";
      feedback?: string;
    }) => {
      const { data, error } = await supabase
        .from("task_submissions")
        .update({
          status,
          feedback: feedback || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["pending-submissions-count"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-stats"] });
    },
  });
}
