import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Application = Tables<"applications">;
type Opportunity = Tables<"opportunities">;

export interface ApplicationWithOpportunity extends Application {
  opportunity: Opportunity;
}

export function useStudentApplications(statusFilter?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-applications", user?.id, statusFilter],
    queryFn: async (): Promise<ApplicationWithOpportunity[]> => {
      if (!user?.id) throw new Error("User not authenticated");

      const query = supabase
        .from("applications")
        .select(`
          *,
          opportunity:opportunities(*)
        `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      const { data, error } = statusFilter && statusFilter !== "all"
        ? await query.eq("status", statusFilter as Application["status"])
        : await query;

      if (error) throw error;
      return (data as unknown as ApplicationWithOpportunity[]) || [];
    },
    enabled: !!user?.id,
  });
}

export function useCreateApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      opportunityId,
      coverLetter,
      resumeUrl,
    }: {
      opportunityId: string;
      coverLetter?: string;
      resumeUrl?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("applications")
        .insert({
          student_id: user.id,
          opportunity_id: opportunityId,
          cover_letter: coverLetter || null,
          resume_url: resumeUrl || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student-applications"] });
      queryClient.invalidateQueries({ queryKey: ["student-stats"] });
      queryClient.invalidateQueries({ queryKey: ["has-applied", undefined, variables.opportunityId] });
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: "withdrawn" })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-applications"] });
      queryClient.invalidateQueries({ queryKey: ["student-stats"] });
    },
  });
}

export function useHasApplied(opportunityId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["has-applied", user?.id, opportunityId],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from("applications")
        .select("id, status")
        .eq("student_id", user.id)
        .eq("opportunity_id", opportunityId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!opportunityId,
  });
}
