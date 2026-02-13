import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAIRecommendations(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ai-recommendations", user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-match", {
        body: { type: "student-recommendations", limit },
      });

      if (error) throw error;
      return data as {
        matches: Array<{
          id: string;
          title: string;
          company_name: string;
          skills_required: string[];
          duration_hours: number;
          level: string;
          is_remote: boolean;
          description: string;
        }>;
        reasons: Record<string, string>;
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useAICandidateMatching(opportunityId: string, limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ai-candidates", opportunityId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-match", {
        body: { type: "recruiter-candidates", opportunity_id: opportunityId, limit },
      });

      if (error) throw error;
      return data as {
        candidates: Array<{
          user_id: string;
          full_name: string | null;
          email: string;
        }>;
        reasons: Record<string, string>;
      };
    },
    enabled: !!user && !!opportunityId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
