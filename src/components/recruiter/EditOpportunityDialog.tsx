import { useState } from "react";
import { Edit, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateOpportunity } from "@/hooks/useRecruiterData";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Opportunity = Tables<"opportunities">;

interface EditOpportunityDialogProps {
  opportunity: Opportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOpportunityDialog({ opportunity, open, onOpenChange }: EditOpportunityDialogProps) {
  const { toast } = useToast();
  const updateOpportunity = useUpdateOpportunity();

  const [title, setTitle] = useState(opportunity.title);
  const [description, setDescription] = useState(opportunity.description);
  const [companyName, setCompanyName] = useState(opportunity.company_name);
  const [level, setLevel] = useState(opportunity.level);
  const [isRemote, setIsRemote] = useState(opportunity.is_remote);
  const [location, setLocation] = useState(opportunity.location || "");
  const [maxApplicants, setMaxApplicants] = useState(opportunity.max_applicants ?? 10);

  const handleSave = async () => {
    try {
      await updateOpportunity.mutateAsync({
        id: opportunity.id,
        data: {
          title,
          description,
          company_name: companyName,
          level,
          is_remote: isRemote,
          location: isRemote ? null : location || null,
          max_applicants: maxApplicants,
        },
      });
      toast({ title: "Opportunity updated", description: "Changes saved successfully." });
      onOpenChange(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update opportunity." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company">Company</Label>
            <Input id="edit-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max">Max Applicants</Label>
              <Input id="edit-max" type="number" min={1} max={100} value={maxApplicants} onChange={(e) => setMaxApplicants(parseInt(e.target.value) || 10)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Remote</Label>
            <Switch checked={isRemote} onCheckedChange={setIsRemote} />
          </div>
          {!isRemote && (
            <div className="space-y-2">
              <Label htmlFor="edit-loc">Location</Label>
              <Input id="edit-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateOpportunity.isPending}>
            {updateOpportunity.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CloseOpportunityButtonProps {
  opportunity: Opportunity;
}

export function CloseOpportunityButton({ opportunity }: CloseOpportunityButtonProps) {
  const { toast } = useToast();
  const updateOpportunity = useUpdateOpportunity();

  const handleClose = async () => {
    try {
      await updateOpportunity.mutateAsync({
        id: opportunity.id,
        data: { status: "closed" },
      });
      toast({ title: "Opportunity closed", description: "This opportunity is no longer accepting applications." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to close opportunity." });
    }
  };

  if (opportunity.status === "closed") return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
          <XCircle className="h-4 w-4" />
          Close
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Opportunity?</AlertDialogTitle>
          <AlertDialogDescription>
            This will stop accepting new applications. Existing applicants and active internships won't be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClose}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Close Opportunity
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
