import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface StudentStats {
  applicationCount: number;
  activeTasksCount: number;
  completedCount: number;
  averageRating: number | null;
}

export function useStudentStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-stats", user?.id],
    queryFn: async (): Promise<StudentStats> => {
      if (!user?.id) throw new Error("User not authenticated");

      // Fetch application counts
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select("id, status")
        .eq("student_id", user.id);

      if (appError) throw appError;

      const applicationCount = applications?.length || 0;
      const completedCount = applications?.filter(
        (app) => app.status === "completed"
      ).length || 0;

      // Fetch active tasks (from accepted/in_progress applications)
      const activeApplicationIds = applications
        ?.filter((app) => app.status === "accepted" || app.status === "in_progress")
        .map((app) => app.id) || [];

      let activeTasksCount = 0;
      if (activeApplicationIds.length > 0) {
        const { data: submissions, error: subError } = await supabase
          .from("task_submissions")
          .select("id, status")
          .eq("student_id", user.id)
          .in("application_id", activeApplicationIds)
          .eq("status", "pending");

        if (subError) throw subError;
        activeTasksCount = submissions?.length || 0;
      }

      // Fetch average rating from feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from("feedback")
        .select("rating, application_id")
        .in("application_id", applications?.map((app) => app.id) || []);

      if (feedbackError) throw feedbackError;

      const averageRating = feedback && feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : null;

      return {
        applicationCount,
        activeTasksCount,
        completedCount,
        averageRating,
      };
    },
    enabled: !!user?.id,
  });
}
