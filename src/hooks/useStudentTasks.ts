import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type TaskSubmission = Tables<"task_submissions">;
type Application = Tables<"applications">;
type Opportunity = Tables<"opportunities">;

export interface TaskWithSubmission extends Task {
  submission?: TaskSubmission | null;
  opportunity?: Opportunity;
  application?: Application;
}

export function useStudentTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-tasks", user?.id],
    queryFn: async (): Promise<TaskWithSubmission[]> => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get active applications (accepted or in_progress)
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          opportunity_id,
          opportunity:opportunities(*)
        `)
        .eq("student_id", user.id)
        .in("status", ["accepted", "in_progress"]);

      if (appError) throw appError;
      if (!applications || applications.length === 0) return [];

      const opportunityIds = applications.map((app) => app.opportunity_id);

      // Get tasks for these opportunities
      const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .in("opportunity_id", opportunityIds)
        .order("order_index", { ascending: true });

      if (taskError) throw taskError;
      if (!tasks) return [];

      // Get submissions for these tasks
      const { data: submissions, error: subError } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("student_id", user.id)
        .in("task_id", tasks.map((t) => t.id));

      if (subError) throw subError;

      // Map tasks with submissions and opportunity info
      return tasks.map((task) => {
        const app = applications.find((a) => a.opportunity_id === task.opportunity_id);
        return {
          ...task,
          submission: submissions?.find((s) => s.task_id === task.id) || null,
          opportunity: app?.opportunity as unknown as Opportunity,
          application: app as unknown as Application,
        };
      });
    },
    enabled: !!user?.id,
  });
}

export function useSubmitTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      applicationId,
      submissionUrl,
      notes,
    }: {
      taskId: string;
      applicationId: string;
      submissionUrl?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("task_submissions")
        .insert({
          task_id: taskId,
          application_id: applicationId,
          student_id: user.id,
          submission_url: submissionUrl || null,
          notes: notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["student-stats"] });
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      submissionUrl,
      notes,
    }: {
      submissionId: string;
      submissionUrl?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("task_submissions")
        .update({
          submission_url: submissionUrl,
          notes: notes,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-tasks"] });
    },
  });
}

export function useDeadlines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-deadlines", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get active applications
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select(`
          id,
          created_at,
          opportunity:opportunities(
            id,
            title,
            company_name,
            deadline
          )
        `)
        .eq("student_id", user.id)
        .in("status", ["accepted", "in_progress"]);

      if (appError) throw appError;
      if (!applications) return [];

      // Get tasks with due dates
      const opportunityIds = applications.map(
        (app) => (app.opportunity as unknown as { id: string }).id
      );

      const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .in("opportunity_id", opportunityIds)
        .not("due_days", "is", null)
        .order("due_days", { ascending: true });

      if (taskError) throw taskError;

      // Get existing submissions
      const { data: submissions } = await supabase
        .from("task_submissions")
        .select("task_id")
        .eq("student_id", user.id);

      const submittedTaskIds = new Set(submissions?.map((s) => s.task_id) || []);

      // Calculate deadlines
      const deadlines = tasks
        ?.filter((task) => !submittedTaskIds.has(task.id))
        .map((task) => {
          const app = applications.find(
            (a) => (a.opportunity as unknown as { id: string }).id === task.opportunity_id
          );
          const appCreatedAt = new Date(app?.created_at || Date.now());
          const dueDate = new Date(appCreatedAt);
          dueDate.setDate(dueDate.getDate() + (task.due_days || 7));

          return {
            id: task.id,
            title: task.title,
            dueDate,
            isUrgent: dueDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000, // Less than 3 days
            opportunity: app?.opportunity,
          };
        })
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 5); // Top 5 deadlines

      return deadlines || [];
    },
    enabled: !!user?.id,
  });
}
