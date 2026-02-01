import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AccountDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GRACE_PERIOD_DAYS = 14;

export function AccountDeletionDialog({ open, onOpenChange }: AccountDeletionDialogProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"warning" | "confirm" | "scheduled">("warning");
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScheduleDeletion = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + GRACE_PERIOD_DAYS);

      const { error } = await supabase
        .from("profiles")
        .update({
          deletion_requested_at: new Date().toISOString(),
          deletion_scheduled_for: deletionDate.toISOString(),
          is_deactivated: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setStep("scheduled");
      toast({
        title: "Account deletion scheduled",
        description: `Your account will be permanently deleted on ${deletionDate.toLocaleDateString()}.`,
      });

      // Sign out after 3 seconds
      setTimeout(async () => {
        await signOut();
        onOpenChange(false);
      }, 3000);
    } catch (error) {
      console.error("Account deletion error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to schedule account deletion. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("warning");
    setConfirmText("");
    onOpenChange(false);
  };

  const expectedConfirmText = "DELETE MY ACCOUNT";

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {step === "scheduled" ? "Deletion Scheduled" : "Delete Account"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === "warning" && "This action cannot be undone after the grace period."}
            {step === "confirm" && "Please type the confirmation text to proceed."}
            {step === "scheduled" && "Your account has been scheduled for deletion."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === "warning" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Deleting your account will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove all your profile information</li>
                  <li>Delete all your applications and submissions</li>
                  <li>Remove access to all conversations</li>
                  <li>Revoke all certificates</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>{GRACE_PERIOD_DAYS}-day grace period:</strong> You have {GRACE_PERIOD_DAYS} days
                to cancel this request. After that, your account and all data will be
                permanently deleted.
              </p>
            </div>

            <AlertDialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep("confirm")}
              >
                Continue
              </Button>
            </AlertDialogFooter>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <code className="px-1 py-0.5 bg-muted rounded">{expectedConfirmText}</code> to confirm:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE MY ACCOUNT"
                className="font-mono"
              />
            </div>

            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setStep("warning")}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleScheduleDeletion}
                disabled={confirmText !== expectedConfirmText || isProcessing}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Deletion
              </Button>
            </AlertDialogFooter>
          </div>
        )}

        {step === "scheduled" && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Deletion Scheduled</AlertTitle>
              <AlertDescription>
                Your account will be permanently deleted in {GRACE_PERIOD_DAYS} days.
                To cancel this, sign in again and visit account settings.
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground text-center">
              You will be signed out shortly...
            </p>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
