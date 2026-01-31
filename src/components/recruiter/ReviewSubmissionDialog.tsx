import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useReviewSubmission, type SubmissionWithDetails } from "@/hooks/useRecruiterSubmissions";

const reviewSchema = z.object({
  status: z.enum(["approved", "needs_revision"]),
  feedback: z.string().max(2000, "Feedback must be less than 2000 characters").optional().or(z.literal("")),
}).refine(
  (data) => data.status === "approved" || (data.feedback && data.feedback.length > 0),
  { message: "Feedback is required when requesting revision", path: ["feedback"] }
);

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: SubmissionWithDetails | null;
}

export function ReviewSubmissionDialog({ open, onOpenChange, submission }: ReviewSubmissionDialogProps) {
  const { toast } = useToast();
  const reviewMutation = useReviewSubmission();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: "approved",
      feedback: "",
    },
  });

  const selectedStatus = watch("status");

  // Reset form when submission changes
  useEffect(() => {
    if (submission) {
      reset({
        status: submission.status === "needs_revision" ? "needs_revision" : "approved",
        feedback: submission.feedback || "",
      });
    }
  }, [submission, reset]);

  const onSubmit = async (data: ReviewFormData) => {
    if (!submission) return;

    try {
      await reviewMutation.mutateAsync({
        submissionId: submission.id,
        status: data.status,
        feedback: data.feedback || undefined,
      });

      toast({
        title: data.status === "approved" ? "Submission Approved" : "Revision Requested",
        description: data.status === "approved" 
          ? "The student's work has been approved." 
          : "The student has been notified to revise their work.",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Review failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
          <DialogDescription>
            Review the student's work and provide feedback.
          </DialogDescription>
        </DialogHeader>

        {/* Submission Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Student:</span>
              <p className="font-medium text-foreground">
                {submission.student.full_name || "Unknown Student"}
              </p>
              <p className="text-xs text-muted-foreground">{submission.student.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Submitted:</span>
              <p className="font-medium text-foreground">
                {format(new Date(submission.submitted_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm">
              <span className="font-medium text-foreground">
                Task {submission.task.order_index + 1}: {submission.task.title}
              </span>
              <span className="text-muted-foreground"> • {submission.opportunity.title}</span>
            </p>
            {submission.task.description && (
              <p className="text-sm text-muted-foreground mt-1">{submission.task.description}</p>
            )}
          </div>

          {submission.submission_url && (
            <div>
              <Label className="text-muted-foreground">Submission URL</Label>
              <a
                href={submission.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm mt-1"
              >
                <ExternalLink className="h-4 w-4" />
                {submission.submission_url}
              </a>
            </div>
          )}

          {submission.notes && (
            <div>
              <Label className="text-muted-foreground">Student Notes</Label>
              <p className="text-sm text-foreground mt-1 bg-muted/30 p-2 rounded">
                {submission.notes}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4 border-t pt-4">
          <div className="space-y-3">
            <Label>Your Decision</Label>
            <RadioGroup
              value={selectedStatus}
              onValueChange={(value) => setValue("status", value as "approved" | "needs_revision")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="cursor-pointer font-normal">
                  ✓ Approve
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="needs_revision" id="needs_revision" />
                <Label htmlFor="needs_revision" className="cursor-pointer font-normal">
                  ↻ Request Revision
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">
              Feedback {selectedStatus === "needs_revision" && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                selectedStatus === "approved"
                  ? "Great work! (optional)"
                  : "Please explain what needs to be improved..."
              }
              rows={4}
              {...register("feedback")}
            />
            {errors.feedback && (
              <p className="text-sm text-destructive">{errors.feedback.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || reviewMutation.isPending}
              variant={selectedStatus === "approved" ? "default" : "destructive"}
            >
              {isSubmitting || reviewMutation.isPending
                ? "Submitting..."
                : selectedStatus === "approved"
                ? "Approve Submission"
                : "Request Revision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
