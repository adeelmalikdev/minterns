import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRecruiterAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recruiter-analytics", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: opportunities } = await supabase
        .from("opportunities").select("id, status, created_at").eq("recruiter_id", user.id);

      const oppIds = opportunities?.map(o => o.id) || [];
      if (oppIds.length === 0) return { funnel: [], responseTime: 0, completionRate: 0, statusBreakdown: [] };

      const { data: applications } = await supabase
        .from("applications").select("id, status, created_at, updated_at, opportunity_id").in("opportunity_id", oppIds);

      // Funnel: pending -> accepted -> in_progress -> completed
      const total = applications?.length || 0;
      const accepted = applications?.filter(a => ["accepted", "in_progress", "completed"].includes(a.status)).length || 0;
      const inProgress = applications?.filter(a => ["in_progress", "completed"].includes(a.status)).length || 0;
      const completed = applications?.filter(a => a.status === "completed").length || 0;

      const funnel = [
        { stage: "Applied", count: total },
        { stage: "Accepted", count: accepted },
        { stage: "In Progress", count: inProgress },
        { stage: "Completed", count: completed },
      ];

      // Average response time (time from application to first status change)
      let totalResponseMs = 0;
      let responseCount = 0;
      applications?.forEach(app => {
        if (app.status !== "pending") {
          const created = new Date(app.created_at).getTime();
          const updated = new Date(app.updated_at).getTime();
          if (updated > created) {
            totalResponseMs += updated - created;
            responseCount++;
          }
        }
      });
      const avgResponseHours = responseCount > 0 ? Math.round(totalResponseMs / responseCount / 3600000) : 0;

      // Completion rate
      const completionRate = accepted > 0 ? Math.round((completed / accepted) * 100) : 0;

      // Status breakdown for pie chart
      const statusCounts: Record<string, number> = {};
      applications?.forEach(a => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });
      const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      return { funnel, responseTime: avgResponseHours, completionRate, statusBreakdown };
    },
    enabled: !!user?.id,
  });
}
