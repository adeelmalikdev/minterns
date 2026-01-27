import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Opportunity = Tables<"opportunities">;

export function useRecommendedOpportunities(limit = 3) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recommended-opportunities", user?.id, limit],
    queryFn: async (): Promise<Opportunity[]> => {
      // Get already applied opportunity IDs
      let appliedIds: string[] = [];
      if (user?.id) {
        const { data: applications } = await supabase
          .from("applications")
          .select("opportunity_id")
          .eq("student_id", user.id);

        appliedIds = applications?.map((app) => app.opportunity_id) || [];
      }

      // Fetch published opportunities, excluding already applied ones
      let query = supabase
        .from("opportunities")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (appliedIds.length > 0) {
        query = query.not("id", "in", `(${appliedIds.join(",")})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });
}

export function useOpportunityDetails(opportunityId: string) {
  return useQuery({
    queryKey: ["opportunity-details", opportunityId],
    queryFn: async () => {
      const { data: opportunity, error: oppError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId)
        .single();

      if (oppError) throw oppError;

      // Fetch tasks for this opportunity
      const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("order_index", { ascending: true });

      if (taskError) throw taskError;

      return {
        ...opportunity,
        tasks: tasks || [],
      };
    },
    enabled: !!opportunityId,
  });
}
