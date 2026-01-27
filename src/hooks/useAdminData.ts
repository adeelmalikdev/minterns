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
  timestamp: string;
  type: "registration" | "application" | "opportunity" | "status_change";
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async (): Promise<RecentActivity[]> => {
      const activities: RecentActivity[] = [];

      // Get recent registrations with roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // Get roles for these users
      const userIds = profiles?.map(p => p.user_id) || [];
      let rolesMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        
        roles?.forEach(r => {
          rolesMap[r.user_id] = r.role;
        });
      }

      profiles?.forEach((p) => {
        const role = rolesMap[p.user_id] || "user";
        activities.push({
          id: `reg-${p.id}`,
          event: `${p.full_name || "New user"} registered as ${role}`,
          time: getRelativeTime(p.created_at),
          timestamp: p.created_at,
          type: "registration",
        });
      });

      // Get recent opportunities with recruiter info
      const { data: opportunities } = await supabase
        .from("opportunities")
        .select("id, title, recruiter_id, created_at, status")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5);

      // Get recruiter profiles
      const recruiterIds = opportunities?.map(o => o.recruiter_id) || [];
      let recruiterMap: Record<string, string> = {};
      
      if (recruiterIds.length > 0) {
        const { data: recruiterProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", recruiterIds);
        
        recruiterProfiles?.forEach(r => {
          recruiterMap[r.user_id] = r.full_name || "Unknown";
        });
      }

      opportunities?.forEach((o) => {
        const recruiterName = recruiterMap[o.recruiter_id] || "Unknown recruiter";
        activities.push({
          id: `opp-${o.id}`,
          event: `"${o.title}" posted by ${recruiterName}`,
          time: getRelativeTime(o.created_at),
          timestamp: o.created_at,
          type: "opportunity",
        });
      });

      // Get recent applications with student and opportunity info
      const { data: applications } = await supabase
        .from("applications")
        .select("id, student_id, opportunity_id, status, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(10);

      // Get student profiles and opportunity details
      const studentIds = applications?.map(a => a.student_id) || [];
      const oppIds = applications?.map(a => a.opportunity_id) || [];
      
      let studentMap: Record<string, string> = {};
      let oppMap: Record<string, { title: string; recruiter_id: string }> = {};

      if (studentIds.length > 0) {
        const { data: studentProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);
        
        studentProfiles?.forEach(s => {
          studentMap[s.user_id] = s.full_name || "Unknown student";
        });
      }

      if (oppIds.length > 0) {
        const { data: opps } = await supabase
          .from("opportunities")
          .select("id, title, recruiter_id")
          .in("id", oppIds);
        
        opps?.forEach(o => {
          oppMap[o.id] = { title: o.title, recruiter_id: o.recruiter_id };
        });

        // Get recruiter names for these opportunities
        const additionalRecruiterIds = opps?.map(o => o.recruiter_id).filter(id => !recruiterMap[id]) || [];
        if (additionalRecruiterIds.length > 0) {
          const { data: moreRecruiters } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", additionalRecruiterIds);
          
          moreRecruiters?.forEach(r => {
            recruiterMap[r.user_id] = r.full_name || "Unknown";
          });
        }
      }

      applications?.forEach((a) => {
        const studentName = studentMap[a.student_id] || "Unknown student";
        const oppInfo = oppMap[a.opportunity_id];
        const oppTitle = oppInfo?.title || "Unknown opportunity";
        const recruiterName = oppInfo ? (recruiterMap[oppInfo.recruiter_id] || "Unknown recruiter") : "Unknown recruiter";

        if (a.status === "pending") {
          activities.push({
            id: `app-${a.id}`,
            event: `${studentName} applied for "${oppTitle}"`,
            time: getRelativeTime(a.created_at),
            timestamp: a.created_at,
            type: "application",
          });
        } else if (a.status === "accepted") {
          activities.push({
            id: `acc-${a.id}`,
            event: `${studentName} accepted by ${recruiterName} for "${oppTitle}"`,
            time: getRelativeTime(a.updated_at),
            timestamp: a.updated_at,
            type: "status_change",
          });
        } else if (a.status === "rejected") {
          activities.push({
            id: `rej-${a.id}`,
            event: `${studentName} rejected by ${recruiterName} for "${oppTitle}"`,
            time: getRelativeTime(a.updated_at),
            timestamp: a.updated_at,
            type: "status_change",
          });
        } else if (a.status === "completed") {
          activities.push({
            id: `comp-${a.id}`,
            event: `${studentName} completed internship at "${oppTitle}"`,
            time: getRelativeTime(a.updated_at),
            timestamp: a.updated_at,
            type: "status_change",
          });
        }
      });

      // Sort by timestamp and take top 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
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
