import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineTaskList } from "@/components/applications/InlineTaskList";
import { useStudentApplications, useWithdrawApplication } from "@/hooks/useStudentApplications";
import { useToast } from "@/hooks/use-toast";
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

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-warning/10 text-warning" },
  accepted: { label: "Accepted", icon: CheckCircle, color: "bg-success/10 text-success" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  in_progress: { label: "In Progress", icon: AlertCircle, color: "bg-info/10 text-info" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-success/10 text-success" },
  withdrawn: { label: "Withdrawn", icon: XCircle, color: "bg-muted text-muted-foreground" },
};

export default function StudentApplications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());

  const toggleCoverLetter = useCallback((applicationId: string) => {
    setExpandedLetters(prev => {
      const next = new Set(prev);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }
      return next;
    });
  }, []);

  const { data: applications, isLoading, error } = useStudentApplications(
    activeTab === "all" ? undefined : activeTab
  );
  const withdrawApplication = useWithdrawApplication();

  const handleWithdraw = async (applicationId: string) => {
    try {
      await withdrawApplication.mutateAsync(applicationId);
      toast({
        title: "Application Withdrawn",
        description: "Your application has been withdrawn successfully.",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to withdraw application";
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

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Navbar userRole="student" />

      <main className="container py-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            My Applications
          </h1>
          <p className="text-muted-foreground">
            Track and manage your micro-internship applications
          </p>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Applications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Error loading applications. Please try again.</p>
            </CardContent>
          </Card>
        ) : applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => {
              const status = statusConfig[application.status];
              const StatusIcon = status.icon;

              return (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Company Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {application.opportunity.company_name.charAt(0)}
                        </span>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {application.opportunity.title}
                          </h3>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {application.opportunity.company_name}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>Applied {format(new Date(application.created_at), "MMM d, yyyy")}</span>
                          <span>•</span>
                          <span>{getDurationLabel(application.opportunity.duration_hours)}</span>
                          <span>•</span>
                          <span>{application.opportunity.is_remote ? "Remote" : "On-site"}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 lg:flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/student/opportunities/${application.opportunity_id}`)}
                          className="gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Button>

                        {application.status === "pending" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Withdraw
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to withdraw your application for "{application.opportunity.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleWithdraw(application.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Withdraw
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {(application.status === "accepted" || application.status === "in_progress") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/student/messages?app=${application.id}`)}
                            className="gap-1"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Message
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Inline Task List for Active Applications */}
                    {(application.status === "accepted" || application.status === "in_progress") && (
                      <InlineTaskList
                        applicationId={application.id}
                        opportunityId={application.opportunity_id}
                        applicationCreatedAt={application.created_at}
                      />
                    )}

                    {/* Cover Letter Preview */}
                    {application.cover_letter && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Cover Letter:</p>
                        <p className={`text-sm text-foreground whitespace-pre-wrap ${!expandedLetters.has(application.id) ? "line-clamp-2" : ""}`}>
                          {application.cover_letter}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto mt-1 text-xs"
                          onClick={() => toggleCoverLetter(application.id)}
                        >
                          {expandedLetters.has(application.id) ? "Show less" : "Show more"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring opportunities and submit your first application!
              </p>
              <Button onClick={() => navigate("/student/opportunities")}>
                Browse Opportunities
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
