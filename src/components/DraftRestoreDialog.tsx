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
import { FileText } from "lucide-react";

interface DraftRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: () => void;
  onDiscard: () => void;
  formName?: string;
}

export function DraftRestoreDialog({
  open,
  onOpenChange,
  onRestore,
  onDiscard,
  formName = "form",
}: DraftRestoreDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <AlertDialogTitle>Restore saved draft?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            We found a previously saved draft for this {formName}. Would you like to restore it
            and continue where you left off, or start fresh?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>Start Fresh</AlertDialogCancel>
          <AlertDialogAction onClick={onRestore}>Restore Draft</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
