import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StarRating } from "@/components/ui/star-rating";
import { useToast } from "@/hooks/use-toast";
import { useSubmitFeedback } from "@/hooks/useFeedback";

const feedbackSchema = z.object({
  rating: z.number().min(1, "Please provide a rating").max(5),
  skillsDemonstrated: z.array(z.string()).min(1, "Select at least one skill"),
  comments: z.string().max(2000, "Comments must be less than 2000 characters").optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  studentName: string;
  opportunityTitle: string;
  companyName: string;
  opportunitySkills: string[];
}

export function FeedbackFormDialog({
  open,
  onOpenChange,
  applicationId,
  studentName,
  opportunityTitle,
  companyName,
  opportunitySkills,
}: FeedbackFormDialogProps) {
  const { toast } = useToast();
  const submitFeedback = useSubmitFeedback();
  const [customSkill, setCustomSkill] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      skillsDemonstrated: [],
      comments: "",
    },
  });

  const selectedSkills = watch("skillsDemonstrated");

  const toggleSkill = (skill: string) => {
    const current = selectedSkills || [];
    if (current.includes(skill)) {
      setValue(
        "skillsDemonstrated",
        current.filter((s) => s !== skill)
      );
    } else {
      setValue("skillsDemonstrated", [...current, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setValue("skillsDemonstrated", [...selectedSkills, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      await submitFeedback.mutateAsync({
        applicationId,
        rating: data.rating,
        skillsDemonstrated: data.skillsDemonstrated,
        comments: data.comments,
      });

      toast({
        title: "Feedback Submitted",
        description: "The internship has been marked as completed.",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Student Performance</DialogTitle>
          <DialogDescription>
            Provide feedback for {studentName}'s work on this internship.
          </DialogDescription>
        </DialogHeader>

        {/* Context Info */}
        <div className="bg-muted/50 p-3 rounded-md text-sm">
          <p className="font-medium text-foreground">{opportunityTitle}</p>
          <p className="text-muted-foreground">{companyName}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>
              Overall Rating <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    size="lg"
                  />
                  <span className="text-sm text-muted-foreground">
                    {field.value > 0 ? `${field.value} of 5` : "Select rating"}
                  </span>
                </div>
              )}
            />
            {errors.rating && (
              <p className="text-sm text-destructive">{errors.rating.message}</p>
            )}
          </div>

          {/* Skills Demonstrated */}
          <div className="space-y-3">
            <Label>
              Skills Demonstrated <span className="text-destructive">*</span>
            </Label>
            
            {/* Selected Skills */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Available Skills from Opportunity */}
            {opportunitySkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Required skills:</p>
                <div className="grid grid-cols-2 gap-2">
                  {opportunitySkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`skill-${skill}`}
                        checked={selectedSkills.includes(skill)}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                      <label
                        htmlFor={`skill-${skill}`}
                        className="text-sm cursor-pointer"
                      >
                        {skill}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Skill */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom skill..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {errors.skillsDemonstrated && (
              <p className="text-sm text-destructive">{errors.skillsDemonstrated.message}</p>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="comments"
                  placeholder="Share your thoughts on the student's performance, work quality, communication, etc..."
                  rows={4}
                  {...field}
                />
              )}
            />
            {errors.comments && (
              <p className="text-sm text-destructive">{errors.comments.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || submitFeedback.isPending}
            >
              {isSubmitting || submitFeedback.isPending
                ? "Submitting..."
                : "Submit Feedback & Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
