import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const generalSubmissionSchema = z.object({
  submissionUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional().or(z.literal("")),
}).refine(
  (data) => (data.submissionUrl && data.submissionUrl.length > 0) || (data.notes && data.notes.length > 0),
  { message: "Please provide either a URL or notes", path: ["notes"] }
);

type GeneralSubmissionFormData = z.infer<typeof generalSubmissionSchema>;

interface ExistingSubmission {
  id: string;
  submission_url: string | null;
  notes: string | null;
  status: string;
}

interface GeneralSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  companyName: string;
  opportunityTitle: string;
  existingSubmission?: ExistingSubmission | null;
}

export function GeneralSubmissionDialog({
  open,
  onOpenChange,
  applicationId,
  companyName,
  opportunityTitle,
  existingSubmission,
}: GeneralSubmissionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const hasExistingSubmission = !!existingSubmission;
  const isReadOnly = existingSubmission?.status === "approved" || existingSubmission?.status === "pending";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GeneralSubmissionFormData>({
    resolver: zodResolver(generalSubmissionSchema),
    defaultValues: {
      submissionUrl: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (existingSubmission) {
      reset({
        submissionUrl: existingSubmission.submission_url || "",
        notes: existingSubmission.notes || "",
      });
    } else {
      reset({ submissionUrl: "", notes: "" });
    }
  }, [existingSubmission, reset]);

  const submitMutation = useMutation({
    mutationFn: async (data: GeneralSubmissionFormData) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Type workaround: task_id is now nullable but types may not reflect this yet
      const insertData = {
        task_id: null as unknown as string, // Cast to satisfy types - DB allows null
        application_id: applicationId,
        student_id: user.id,
        submission_url: data.submissionUrl || null,
        notes: data.notes || null,
        status: "pending" as const,
      };

      const { data: result, error } = await supabase
        .from("task_submissions")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-tasks", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["general-submission", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["student-stats"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: GeneralSubmissionFormData) => {
      if (!existingSubmission?.id) throw new Error("No submission to update");

      const { data: result, error } = await supabase
        .from("task_submissions")
        .update({
          submission_url: data.submissionUrl || null,
          notes: data.notes || null,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existingSubmission.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-tasks", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["general-submission", applicationId] });
    },
  });

  const onSubmit = async (data: GeneralSubmissionFormData) => {
    try {
      if (hasExistingSubmission) {
        await updateMutation.mutateAsync(data);
        toast({
          title: "Submission updated",
          description: "Your work has been resubmitted for review.",
        });
      } else {
        await submitMutation.mutateAsync(data);
        toast({
          title: "Work submitted",
          description: "Your submission is now under review.",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const isPending = submitMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? "View Submission" : hasExistingSubmission ? "Edit Submission" : "Submit Work"}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{opportunityTitle}</span>
            <span className="text-muted-foreground"> • {companyName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">
            Submit your work for this internship. You can provide a link to your work and/or add notes describing what you've accomplished.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="submissionUrl">Submission URL (optional)</Label>
            <Input
              id="submissionUrl"
              type="url"
              placeholder="https://github.com/username/project"
              {...register("submissionUrl")}
              disabled={isReadOnly}
            />
            {errors.submissionUrl && (
              <p className="text-sm text-destructive">{errors.submissionUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Link to your work (GitHub repo, Google Drive, Figma, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Describe your work, approach, challenges faced, or any additional context..."
              rows={4}
              {...register("notes")}
              disabled={isReadOnly}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting || isPending}>
                {isSubmitting || isPending
                  ? "Submitting..."
                  : hasExistingSubmission
                  ? "Update Submission"
                  : "Submit Work"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
