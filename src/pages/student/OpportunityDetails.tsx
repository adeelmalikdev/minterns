import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Users, Calendar, CheckCircle, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useOpportunityDetails } from "@/hooks/useRecommendedOpportunities";
import { useHasApplied, useCreateApplication } from "@/hooks/useStudentApplications";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ResumeUpload } from "@/components/applications/ResumeUpload";

const levelColors = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  advanced: "bg-destructive/10 text-destructive",
};

export default function OpportunityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: opportunity, isLoading, error } = useOpportunityDetails(id || "");
  const { data: existingApplication, isLoading: checkingApplication } = useHasApplied(id || "");
  const createApplication = useCreateApplication();

  const handleApply = async () => {
    if (!id) return;

    try {
      await createApplication.mutateAsync({
        opportunityId: id,
        coverLetter: coverLetter || undefined,
        resumeUrl: resumeUrl || undefined,
      });
      toast({
        title: "Application Submitted!",
        description: "Your application has been sent to the recruiter.",
      });
      setIsDialogOpen(false);
      setCoverLetter("");
      setResumeUrl(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit application";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getDurationLabel = (hours: number) => {
    if (hours <= 20) return "1 week";
    if (hours <= 40) return "2 weeks";
    if (hours <= 60) return "3 weeks";
    return "1 month+";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar userRole="student" />
        <main className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar userRole="student" />
        <main className="container py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Opportunity not found or you don't have access.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const hasApplied = !!existingApplication;
  const applicationStatus = existingApplication && typeof existingApplication === 'object' 
    ? existingApplication.status 
    : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="student" />

      <main className="container py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Opportunities
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                      {opportunity.title}
                    </h1>
                    <p className="text-lg text-muted-foreground">{opportunity.company_name}</p>
                  </div>
                  <Badge className={levelColors[opportunity.level]}>
                    {opportunity.level.charAt(0).toUpperCase() + opportunity.level.slice(1)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {opportunity.is_remote ? "Remote" : opportunity.location || "On-site"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getDurationLabel(opportunity.duration_hours)}
                  </div>
                  {opportunity.max_applicants && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Max {opportunity.max_applicants} applicants
                    </div>
                  )}
                  {opportunity.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Deadline: {format(new Date(opportunity.deadline), "MMM d, yyyy")}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {opportunity.skills_required.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {opportunity.description}
                </p>
              </CardContent>
            </Card>

            {/* Tasks */}
            {opportunity.tasks && opportunity.tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Tasks ({opportunity.tasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {opportunity.tasks.map((task, index) => (
                    <div key={task.id} className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                        {task.due_days && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Due: {task.due_days} days after acceptance
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card>
              <CardContent className="pt-6">
                {checkingApplication ? (
                  <Skeleton className="h-10 w-full" />
                ) : hasApplied ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="font-medium text-foreground mb-1">Already Applied</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Status: {applicationStatus?.replace("_", " ").charAt(0).toUpperCase() + applicationStatus?.slice(1).replace("_", " ")}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/student/applications")}
                    >
                      View My Applications
                    </Button>
                  </div>
                ) : (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for {opportunity.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Resume (Optional)</Label>
                          <ResumeUpload
                            onUploadComplete={setResumeUrl}
                            onRemove={() => setResumeUrl(null)}
                            currentResume={resumeUrl}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                          <Textarea
                            id="coverLetter"
                            placeholder="Tell the recruiter why you're a great fit for this opportunity..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            rows={6}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          By applying, you agree to complete the assigned tasks within the specified timeframe.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleApply}
                          disabled={createApplication.isPending}
                        >
                          {createApplication.isPending ? "Submitting..." : "Submit Application"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            {/* Posted Info */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Posted {format(new Date(opportunity.created_at), "MMMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
