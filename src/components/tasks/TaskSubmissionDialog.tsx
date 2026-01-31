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
import { useSubmitTask, useUpdateSubmission, type TaskWithSubmission } from "@/hooks/useStudentTasks";

const taskSubmissionSchema = z.object({
  submissionUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional().or(z.literal("")),
}).refine(
  (data) => (data.submissionUrl && data.submissionUrl.length > 0) || (data.notes && data.notes.length > 0),
  { message: "Please provide either a URL or notes", path: ["notes"] }
);

type TaskSubmissionFormData = z.infer<typeof taskSubmissionSchema>;

interface TaskSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithSubmission | null;
}

export function TaskSubmissionDialog({ open, onOpenChange, task }: TaskSubmissionDialogProps) {
  const { toast } = useToast();
  const submitTask = useSubmitTask();
  const updateSubmission = useUpdateSubmission();

  const hasExistingSubmission = !!task?.submission;
  const isReadOnly = task?.submission?.status === "approved" || task?.submission?.status === "pending";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskSubmissionFormData>({
    resolver: zodResolver(taskSubmissionSchema),
    defaultValues: {
      submissionUrl: "",
      notes: "",
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        submissionUrl: task.submission?.submission_url || "",
        notes: task.submission?.notes || "",
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskSubmissionFormData) => {
    if (!task || !task.application?.id) return;

    try {
      if (hasExistingSubmission && task.submission?.id) {
        // Update existing submission
        await updateSubmission.mutateAsync({
          submissionId: task.submission.id,
          submissionUrl: data.submissionUrl || undefined,
          notes: data.notes || undefined,
        });
        toast({
          title: "Submission updated",
          description: "Your work has been resubmitted for review.",
        });
      } else {
        // Create new submission
        await submitTask.mutateAsync({
          taskId: task.id,
          applicationId: task.application.id,
          submissionUrl: data.submissionUrl || undefined,
          notes: data.notes || undefined,
        });
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

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? "View Submission" : hasExistingSubmission ? "Edit Submission" : "Submit Work"}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{task.title}</span>
            {task.opportunity?.company_name && (
              <span className="text-muted-foreground"> • {task.opportunity.company_name}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {task.description && (
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Task Description:</span> {task.description}
            </p>
          </div>
        )}

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
              placeholder="Describe your approach, challenges faced, or any additional context..."
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
              <Button type="submit" disabled={isSubmitting || submitTask.isPending || updateSubmission.isPending}>
                {isSubmitting || submitTask.isPending || updateSubmission.isPending
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
