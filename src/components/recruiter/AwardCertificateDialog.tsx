import { useState } from "react";
import { Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AwardCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  studentId: string;
  studentName: string;
  opportunityTitle: string;
}

export function AwardCertificateDialog({
  open,
  onOpenChange,
  applicationId,
  studentId,
  studentName,
  opportunityTitle,
}: AwardCertificateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAwarding, setIsAwarding] = useState(false);

  const handleAward = async () => {
    setIsAwarding(true);
    try {
      // Check if certificate already exists
      const { data: existing } = await supabase
        .from("certificates")
        .select("id")
        .eq("application_id", applicationId)
        .maybeSingle();

      if (existing) {
        toast({ title: "Already awarded", description: "A certificate already exists for this application." });
        onOpenChange(false);
        return;
      }

      const { error } = await supabase
        .from("certificates")
        .insert({
          application_id: applicationId,
          student_id: studentId,
        });

      if (error) throw error;

      // Mark application as completed
      await supabase
        .from("applications")
        .update({ status: "completed" })
        .eq("id", applicationId);

      queryClient.invalidateQueries({ queryKey: ["recruiter-opportunity-applicants"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-stats"] });
      toast({ title: "Certificate Awarded!", description: `Certificate issued to ${studentName}.` });
      onOpenChange(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to award certificate." });
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Award Certificate
          </DialogTitle>
          <DialogDescription>
            Issue a completion certificate to <strong>{studentName}</strong> for{" "}
            <strong>{opportunityTitle}</strong>. This will also mark the application as completed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAward} disabled={isAwarding} className="gap-2">
            {isAwarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            {isAwarding ? "Awarding..." : "Award Certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
