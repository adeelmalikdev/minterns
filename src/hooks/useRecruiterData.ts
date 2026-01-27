import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Opportunity = Tables<"opportunities">;

export function useRecruiterStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recruiter-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get opportunities count
      const { data: opportunities, error: oppError } = await supabase
        .from("opportunities")
        .select("id, status")
        .eq("recruiter_id", user.id);

      if (oppError) throw oppError;

      const activePostings = opportunities?.filter((o) => o.status === "published").length || 0;

      // Get total applicants across all opportunities
      const opportunityIds = opportunities?.map((o) => o.id) || [];
      let totalApplicants = 0;

      if (opportunityIds.length > 0) {
        const { count, error: appError } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("opportunity_id", opportunityIds);

        if (appError) throw appError;
        totalApplicants = count || 0;
      }

      // Get completed tasks count
      let completedTasks = 0;
      if (opportunityIds.length > 0) {
        const { count, error: taskError } = await supabase
          .from("task_submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved");

        if (!taskError) {
          completedTasks = count || 0;
        }
      }

      return {
        activePostings,
        totalApplicants,
        completedTasks,
        totalOpportunities: opportunities?.length || 0,
      };
    },
    enabled: !!user?.id,
  });
}

export function useRecruiterOpportunities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recruiter-opportunities", user?.id],
    queryFn: async (): Promise<Opportunity[]> => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useRecruiterOpportunityWithApplicants(opportunityId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recruiter-opportunity-applicants", opportunityId],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get opportunity
      const { data: opportunity, error: oppError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId)
        .eq("recruiter_id", user.id)
        .single();

      if (oppError) throw oppError;

      // Get applications
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });

      if (appError) throw appError;

      // Get profiles for these students
      const studentIds = applications?.map((app) => app.student_id) || [];
      let profilesMap: Record<string, { full_name: string | null; email: string; avatar_url: string | null }> = {};

      if (studentIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url")
          .in("user_id", studentIds);

        if (!profileError && profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      // Merge applications with profiles
      const applicationsWithProfiles = applications?.map((app) => ({
        ...app,
        profile: profilesMap[app.student_id] || null,
      })) || [];

      // Get tasks
      const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("order_index", { ascending: true });

      if (taskError) throw taskError;

      return {
        opportunity,
        applications: applicationsWithProfiles,
        tasks: tasks || [],
      };
    },
    enabled: !!user?.id && !!opportunityId,
  });
}

export function useCreateOpportunity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      opportunity: Omit<TablesInsert<"opportunities">, "recruiter_id">;
      tasks: { title: string; description: string; due_days: number }[];
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Create opportunity
      const { data: opportunity, error: oppError } = await supabase
        .from("opportunities")
        .insert({
          ...data.opportunity,
          recruiter_id: user.id,
        })
        .select()
        .single();

      if (oppError) throw oppError;

      // Create tasks if any
      if (data.tasks.length > 0) {
        const tasksToInsert = data.tasks.map((task, index) => ({
          opportunity_id: opportunity.id,
          title: task.title,
          description: task.description,
          due_days: task.due_days,
          order_index: index,
        }));

        const { error: taskError } = await supabase
          .from("tasks")
          .insert(tasksToInsert);

        if (taskError) throw taskError;
      }

      return opportunity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-stats"] });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TablesInsert<"opportunities">>;
    }) => {
      const { data: opportunity, error } = await supabase
        .from("opportunities")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return opportunity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-opportunities"] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: "accepted" | "rejected" | "in_progress" | "completed";
    }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-opportunity-applicants"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-stats"] });
    },
  });
}
