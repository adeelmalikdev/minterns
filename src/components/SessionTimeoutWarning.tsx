import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessionTimeout, formatTimeRemaining } from "@/hooks/useSessionTimeout";
import { Clock } from "lucide-react";

export function SessionTimeoutWarning() {
  const { showWarning, timeRemaining, extendSession, dismissWarning } = useSessionTimeout();

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Your session will expire in{" "}
              <span className="font-mono font-bold text-foreground">
                {formatTimeRemaining(timeRemaining)}
              </span>{" "}
              due to inactivity.
            </p>
            <p>Would you like to stay signed in?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={dismissWarning}>Sign Out</AlertDialogCancel>
          <AlertDialogAction onClick={extendSession}>
            Stay Signed In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
