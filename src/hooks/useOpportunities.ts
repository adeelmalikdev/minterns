import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FilterState {
  duration: string[];
  level: string[];
  skills: string[];
  type: string[];
  search: string;
}

// Map duration filter values to hour ranges
function getDurationRange(duration: string): { min: number; max: number } {
  switch (duration) {
    case "1_week":
      return { min: 0, max: 40 };
    case "2_weeks":
      return { min: 41, max: 80 };
    case "3_weeks":
      return { min: 81, max: 120 };
    case "1_month_plus":
      return { min: 121, max: 999999 };
    default:
      return { min: 0, max: 999999 };
  }
}

export function useOpportunities(filters: FilterState, sortBy: string = "recent") {
  return useQuery({
    queryKey: ["opportunities", filters, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("opportunities")
        .select("*")
        .eq("status", "published");

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
        );
      }

      // Apply level filter
      if (filters.level.length > 0) {
        query = query.in("level", filters.level as ("beginner" | "intermediate" | "advanced")[]);
      }

      // Apply type filter (remote/onsite)
      if (filters.type.length === 1) {
        if (filters.type[0] === "remote") {
          query = query.eq("is_remote", true);
        } else if (filters.type[0] === "onsite") {
          query = query.eq("is_remote", false);
        }
      }

      // Apply sorting
      if (sortBy === "recent") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "oldest") {
        query = query.order("created_at", { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Client-side filtering for duration and skills (more complex logic)
      let filteredData = data || [];

      // Duration filter
      if (filters.duration.length > 0) {
        filteredData = filteredData.filter((opp) => {
          return filters.duration.some((d) => {
            const range = getDurationRange(d);
            return opp.duration_hours >= range.min && opp.duration_hours <= range.max;
          });
        });
      }

      // Skills filter (any match)
      if (filters.skills.length > 0) {
        filteredData = filteredData.filter((opp) => {
          const oppSkills = opp.skills_required.map((s: string) => s.toLowerCase());
          return filters.skills.some((skill) =>
            oppSkills.includes(skill.toLowerCase())
          );
        });
      }

      return filteredData;
    },
  });
}
