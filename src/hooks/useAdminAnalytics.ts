import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useApplicationTrends() {
  return useQuery({
    queryKey: ["admin-application-trends"],
    queryFn: async () => {
      const { data: applications } = await supabase
        .from("applications").select("created_at, status").order("created_at", { ascending: true });

      const monthly: Record<string, { total: number; accepted: number; rejected: number; completed: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString("default", { month: "short" });
        monthly[key] = { total: 0, accepted: 0, rejected: 0, completed: 0 };
      }

      applications?.forEach(a => {
        const key = new Date(a.created_at).toLocaleString("default", { month: "short" });
        if (monthly[key]) {
          monthly[key].total++;
          if (a.status === "accepted" || a.status === "in_progress") monthly[key].accepted++;
          if (a.status === "rejected") monthly[key].rejected++;
          if (a.status === "completed") monthly[key].completed++;
        }
      });

      return Object.entries(monthly).map(([month, data]) => ({ month, ...data }));
    },
  });
}

export function useSkillTrends() {
  return useQuery({
    queryKey: ["admin-skill-trends"],
    queryFn: async () => {
      const { data: opportunities } = await supabase
        .from("opportunities").select("skills_required").eq("status", "published");

      const skillCounts: Record<string, number> = {};
      opportunities?.forEach(o => {
        o.skills_required.forEach((s: string) => {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        });
      });

      return Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));
    },
  });
}

export function useCompletionRates() {
  return useQuery({
    queryKey: ["admin-completion-rates"],
    queryFn: async () => {
      const { data: applications } = await supabase
        .from("applications").select("status");

      const total = applications?.length || 0;
      const completed = applications?.filter(a => a.status === "completed").length || 0;
      const inProgress = applications?.filter(a => a.status === "in_progress").length || 0;
      const accepted = applications?.filter(a => a.status === "accepted").length || 0;
      const pending = applications?.filter(a => a.status === "pending").length || 0;
      const rejected = applications?.filter(a => a.status === "rejected").length || 0;

      return [
        { name: "Completed", value: completed, fill: "hsl(var(--success))" },
        { name: "In Progress", value: inProgress, fill: "hsl(var(--info))" },
        { name: "Accepted", value: accepted, fill: "hsl(var(--primary))" },
        { name: "Pending", value: pending, fill: "hsl(var(--warning))" },
        { name: "Rejected", value: rejected, fill: "hsl(var(--destructive))" },
      ].filter(d => d.value > 0);
    },
  });
}
