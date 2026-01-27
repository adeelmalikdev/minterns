import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalStudents: number;
  totalRecruiters: number;
  totalOpportunities: number;
  pendingReviews: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      // Count students
      const { count: studentsCount, error: studentsError } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "student");

      if (studentsError) throw studentsError;

      // Count recruiters
      const { count: recruitersCount, error: recruitersError } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "recruiter");

      if (recruitersError) throw recruitersError;

      // Count opportunities
      const { count: oppsCount, error: oppsError } = await supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true });

      if (oppsError) throw oppsError;

      // Count pending applications (for pending reviews)
      const { count: pendingCount, error: pendingError } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingError) throw pendingError;

      return {
        totalStudents: studentsCount || 0,
        totalRecruiters: recruitersCount || 0,
        totalOpportunities: oppsCount || 0,
        pendingReviews: pendingCount || 0,
      };
    },
  });
}

interface PlatformGrowth {
  month: string;
  users: number;
}

export function usePlatformGrowth() {
  return useQuery({
    queryKey: ["platform-growth"],
    queryFn: async (): Promise<PlatformGrowth[]> => {
      // Get user registrations by month
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyGrowth = new Map<string, number>();
      let runningTotal = 0;

      profiles?.forEach((profile) => {
        const date = new Date(profile.created_at);
        const monthKey = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
        runningTotal++;
        monthlyGrowth.set(monthKey, runningTotal);
      });

      // Convert to array, take last 6 months
      const result = Array.from(monthlyGrowth.entries())
        .map(([month, users]) => ({ month, users }))
        .slice(-6);

      // If no data, return placeholder
      if (result.length === 0) {
        return [{ month: "Jan", users: 0 }];
      }

      return result;
    },
  });
}

interface RecentActivity {
  id: string;
  event: string;
  time: string;
  type: "registration" | "application" | "opportunity";
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async (): Promise<RecentActivity[]> => {
      const activities: RecentActivity[] = [];

      // Get recent registrations
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      profiles?.forEach((p) => {
        activities.push({
          id: `reg-${p.id}`,
          event: `${p.full_name || "New user"} registered`,
          time: getRelativeTime(p.created_at),
          type: "registration",
        });
      });

      // Get recent applications
      const { data: applications } = await supabase
        .from("applications")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      applications?.forEach((a) => {
        activities.push({
          id: `app-${a.id}`,
          event: "New application submitted",
          time: getRelativeTime(a.created_at),
          type: "application",
        });
      });

      // Get recent opportunities
      const { data: opportunities } = await supabase
        .from("opportunities")
        .select("id, title, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);

      opportunities?.forEach((o) => {
        activities.push({
          id: `opp-${o.id}`,
          event: `Opportunity "${o.title}" published`,
          time: getRelativeTime(o.created_at),
          type: "opportunity",
        });
      });

      // Sort by time and take top 5
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);
    },
  });
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
