import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Calendar, FileText, Check, X, MessageSquare, Download, Loader2, Award } from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";
import { useRecruiterOpportunityWithApplicants, useUpdateApplicationStatus } from "@/hooks/useRecruiterData";
import { useApplicationCompletionStatus, useFeedbackForApplication } from "@/hooks/useFeedback";
import { useToast } from "@/hooks/use-toast";
import { FeedbackFormDialog } from "@/components/recruiter/FeedbackFormDialog";
import { CompletionStatusCard } from "@/components/recruiter/CompletionStatus";
import { AwardCertificateDialog } from "@/components/recruiter/AwardCertificateDialog";
import { supabase } from "@/integrations/supabase/client";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning" },
  accepted: { label: "Accepted", color: "bg-success/10 text-success" },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive" },
  in_progress: { label: "In Progress", color: "bg-info/10 text-info" },
  completed: { label: "Completed", color: "bg-success/10 text-success" },
  withdrawn: { label: "Withdrawn", color: "bg-muted text-muted-foreground" },
};

export default function ManageApplicants() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, isLoading, error } = useRecruiterOpportunityWithApplicants(id || "");
  const updateStatus = useUpdateApplicationStatus();

  const handleUpdateStatus = async (
    applicationId: string,
    status: "accepted" | "rejected" | "in_progress"
  ) => {
    try {
      await updateStatus.mutateAsync({ applicationId, status });
      toast({
        title: "Status Updated",
        description: `Application has been ${status}.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar userRole="recruiter" />
        <main className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 w-full mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar userRole="recruiter" />
        <main className="container py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Opportunity not found or you don't have access.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { opportunity, applications } = data;
  const pendingApplicants = applications.filter((a) => a.status === "pending");
  const activeApplicants = applications.filter((a) => 
    a.status === "accepted" || a.status === "in_progress"
  );
  const completedApplicants = applications.filter((a) => a.status === "completed");

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Navbar userRole="recruiter" />

      <main className="container py-8 flex-1">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Opportunity Info */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {opportunity.title}
                </h1>
                <p className="text-muted-foreground">{opportunity.company_name}</p>
              </div>
              <Badge
                variant="secondary"
                className={
                  opportunity.status === "published"
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }
              >
                {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
              </Badge>
            </div>
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <span>{applications.length} Total Applicants</span>
              <span>•</span>
              <span>{pendingApplicants.length} Pending Review</span>
              <span>•</span>
              <span>{activeApplicants.length} Active</span>
              <span>•</span>
              <span>{completedApplicants.length} Completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Applications */}
        {pendingApplicants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Pending Review ({pendingApplicants.length})</h2>
            <div className="space-y-4">
              {pendingApplicants.map((application) => (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  opportunityId={opportunity.id}
                  opportunityTitle={opportunity.title}
                  companyName={opportunity.company_name}
                  opportunitySkills={opportunity.skills_required}
                  onAccept={() => handleUpdateStatus(application.id, "accepted")}
                  onReject={() => handleUpdateStatus(application.id, "rejected")}
                  isPending={updateStatus.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Internships */}
        {activeApplicants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Active Internships ({activeApplicants.length})</h2>
            <div className="space-y-4">
              {activeApplicants.map((application) => (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  opportunityId={opportunity.id}
                  opportunityTitle={opportunity.title}
                  companyName={opportunity.company_name}
                  opportunitySkills={opportunity.skills_required}
                  onAccept={() => handleUpdateStatus(application.id, "in_progress")}
                  onReject={() => {}}
                  isPending={updateStatus.isPending}
                  showActions={false}
                  showCompletion
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedApplicants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Completed ({completedApplicants.length})</h2>
            <div className="space-y-4">
              {completedApplicants.map((application) => (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  opportunityId={opportunity.id}
                  opportunityTitle={opportunity.title}
                  companyName={opportunity.company_name}
                  opportunitySkills={opportunity.skills_required}
                  onAccept={() => {}}
                  onReject={() => {}}
                  isPending={false}
                  showActions={false}
                  showCompletion
                />
              ))}
            </div>
          </div>
        )}

        {/* All Applications */}
        {applications.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No applications yet</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}

interface ApplicantCardProps {
  application: {
    id: string;
    student_id: string;
    status: string;
    cover_letter: string | null;
    resume_url: string | null;
    created_at: string;
    profile: {
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    } | null;
  };
  opportunityId: string;
  opportunityTitle: string;
  companyName: string;
  opportunitySkills: string[];
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
  showActions?: boolean;
  showCompletion?: boolean;
}

function ApplicantCard({
  application,
  opportunityId,
  opportunityTitle,
  companyName,
  opportunitySkills,
  onAccept,
  onReject,
  isPending,
  showActions = true,
  showCompletion = false,
}: ApplicantCardProps) {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [viewFeedbackOpen, setViewFeedbackOpen] = useState(false);
  const [viewApplicationOpen, setViewApplicationOpen] = useState(false);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  
  const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.pending;
  const profile = application.profile;

  const { data: completionStatus, isLoading: completionLoading } = useApplicationCompletionStatus(
    application.id,
    opportunityId
  );
  
  const { data: existingFeedback } = useFeedbackForApplication(application.id);

  // Fetch resume URL when dialog opens
  useEffect(() => {
    const fetchResumeUrl = async () => {
      if (viewApplicationOpen && application.resume_url) {
        setLoadingResume(true);
        try {
          const { data, error } = await supabase.storage
            .from("resumes")
            .createSignedUrl(application.resume_url, 3600);
          
          if (!error && data) {
            setResumeUrl(data.signedUrl);
          }
        } catch {
          // Silently fail
        } finally {
          setLoadingResume(false);
        }
      }
    };

    fetchResumeUrl();
  }, [viewApplicationOpen, application.resume_url]);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar & Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">
                  {profile?.full_name || "Unknown Student"}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {profile?.email || "No email"}
                </p>
              </div>
            </div>

            {/* Status & Date */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge className={status.color}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {format(new Date(application.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewApplicationOpen(true)}
                className="gap-1"
              >
                <FileText className="h-4 w-4" />
                View Application
              </Button>

              {(application.status === "accepted" || application.status === "in_progress") && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/recruiter/messages?app=${application.id}`}
                    className="gap-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCertificateDialogOpen(true)}
                    className="gap-1"
                  >
                    <Award className="h-4 w-4" />
                    Award Certificate
                  </Button>
                </>
              )}

              {showActions && application.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={onAccept}
                    disabled={isPending}
                    className="gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Application?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject this application? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onReject}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {/* Completion Status for Active/Completed */}
          {showCompletion && (
            <CompletionStatusCard
              status={completionStatus}
              isLoading={completionLoading}
              onComplete={() => setFeedbackDialogOpen(true)}
              hasExistingFeedback={!!existingFeedback}
              onViewFeedback={() => setViewFeedbackOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={viewApplicationOpen} onOpenChange={setViewApplicationOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Applicant Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {profile?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {profile?.full_name || "Unknown Student"}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {profile?.email || "No email"}
                </div>
              </div>
            </div>

            {/* Application Meta */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Applied {format(new Date(application.created_at), "MMMM d, yyyy")}</span>
              </div>
            </div>

            {/* Resume */}
            <div className="space-y-2">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resume
              </h4>
              {application.resume_url ? (
                <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
                  <span className="text-sm text-foreground">Resume.pdf</span>
                  {loadingResume ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : resumeUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resumeUrl, "_blank")}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      View Resume
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground">No resume attached</p>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            {application.cover_letter ? (
              <div className="space-y-2">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cover Letter
                </h4>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {application.cover_letter}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed text-center">
                <p className="text-sm text-muted-foreground">No cover letter provided</p>
              </div>
            )}

            {/* Actions in Dialog */}
            {showActions && application.status === "pending" && (
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={onAccept} disabled={isPending} className="gap-1 flex-1">
                  <Check className="h-4 w-4" />
                  Accept Application
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isPending} className="gap-1 flex-1">
                      <X className="h-4 w-4" />
                      Reject Application
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Application?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reject this application? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onReject}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Form Dialog */}
      <FeedbackFormDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        applicationId={application.id}
        studentName={profile?.full_name || "Unknown Student"}
        opportunityTitle={opportunityTitle}
        companyName={companyName}
        opportunitySkills={opportunitySkills}
      />

      {/* View Feedback Dialog */}
      <Dialog open={viewFeedbackOpen} onOpenChange={setViewFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback for {profile?.full_name}</DialogTitle>
          </DialogHeader>
          {existingFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                <div className="flex items-center gap-2">
                  <StarRating value={existingFeedback.rating} readOnly size="md" />
                  <span className="font-medium">{existingFeedback.rating}/5</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Skills Demonstrated</p>
                <div className="flex flex-wrap gap-1">
                  {existingFeedback.skills_demonstrated.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
              {existingFeedback.comments && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Comments</p>
                  <p className="text-sm text-foreground">{existingFeedback.comments}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted on {format(new Date(existingFeedback.created_at), "MMM d, yyyy")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Award Certificate Dialog */}
      <AwardCertificateDialog
        open={certificateDialogOpen}
        onOpenChange={setCertificateDialogOpen}
        applicationId={application.id}
        studentId={application.student_id || ""}
        studentName={profile?.full_name || "Unknown Student"}
        opportunityTitle={opportunityTitle}
      />
    </>
  );
}
